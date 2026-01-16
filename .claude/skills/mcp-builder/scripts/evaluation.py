#!/usr/bin/env python3
"""MCP Server Evaluation Harness.

This script evaluates MCP servers by running test questions through Claude
and analyzing the results.
"""

import argparse
import asyncio
import json
import os
import re
import sys
import time
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

import anthropic

from connections import create_connection, MCPConnection


@dataclass
class QAPair:
    """A question-answer pair for evaluation."""
    question: str
    answer: str


@dataclass
class TaskResult:
    """Result of evaluating a single task."""
    question: str
    expected_answer: str
    actual_answer: str
    is_correct: bool
    duration: float
    tool_calls: int
    summary: str
    feedback: str


@dataclass
class EvaluationReport:
    """Complete evaluation report."""
    total_tasks: int
    correct_tasks: int
    accuracy: float
    avg_duration: float
    total_tool_calls: int
    results: list[TaskResult] = field(default_factory=list)


def parse_evaluation_file(filepath: str) -> list[QAPair]:
    """Parse XML evaluation file containing question-answer pairs."""
    tree = ET.parse(filepath)
    root = tree.getroot()

    qa_pairs = []
    for qa_pair in root.findall('qa_pair'):
        question = qa_pair.find('question').text.strip()
        answer = qa_pair.find('answer').text.strip()
        qa_pairs.append(QAPair(question=question, answer=answer))

    return qa_pairs


def extract_answer(response: str) -> str:
    """Extract the final answer from Claude's response."""
    # Look for answer in XML tags
    match = re.search(r'<answer>(.*?)</answer>', response, re.DOTALL)
    if match:
        return match.group(1).strip()

    # Look for answer after "Final answer:" or similar
    patterns = [
        r'(?:final answer|answer):\s*(.+?)(?:\n|$)',
        r'(?:the answer is|result is):\s*(.+?)(?:\n|$)',
    ]
    for pattern in patterns:
        match = re.search(pattern, response, re.IGNORECASE)
        if match:
            return match.group(1).strip()

    # Return last line as fallback
    lines = [l.strip() for l in response.strip().split('\n') if l.strip()]
    return lines[-1] if lines else ""


def extract_summary(response: str) -> str:
    """Extract summary from Claude's response."""
    match = re.search(r'<summary>(.*?)</summary>', response, re.DOTALL)
    if match:
        return match.group(1).strip()
    return ""


def extract_feedback(response: str) -> str:
    """Extract feedback from Claude's response."""
    match = re.search(r'<feedback>(.*?)</feedback>', response, re.DOTALL)
    if match:
        return match.group(1).strip()
    return ""


async def agent_loop(
    client: anthropic.Anthropic,
    connection: MCPConnection,
    question: str,
    model: str,
    max_turns: int = 50
) -> tuple[str, int]:
    """Run the agentic loop where Claude uses MCP tools to answer a question."""

    tools = await connection.list_tools()

    # Convert MCP tools to Anthropic tool format
    anthropic_tools = []
    for tool in tools:
        anthropic_tools.append({
            "name": tool["name"],
            "description": tool["description"] or "",
            "input_schema": tool["input_schema"]
        })

    system_prompt = """You are an AI assistant evaluating an MCP server's tools.
Your task is to answer the given question using ONLY the available tools.

Instructions:
1. Use the available tools to gather information needed to answer the question
2. Think step by step and use multiple tool calls if needed
3. Once you have the answer, provide:
   - A brief summary of your approach in <summary> tags
   - Constructive feedback on the tools in <feedback> tags
   - Your final answer in <answer> tags

Example response format:
<summary>
I searched for X, then looked up Y to find the answer.
</summary>
<feedback>
The search tool worked well but could benefit from filtering options.
</feedback>
<answer>
42
</answer>
"""

    messages = [{"role": "user", "content": question}]
    tool_calls = 0

    for _ in range(max_turns):
        response = client.messages.create(
            model=model,
            max_tokens=4096,
            system=system_prompt,
            tools=anthropic_tools,
            messages=messages
        )

        # Check if we're done
        if response.stop_reason == "end_turn":
            # Extract text response
            text_content = ""
            for block in response.content:
                if hasattr(block, 'text'):
                    text_content += block.text
            return text_content, tool_calls

        # Process tool calls
        if response.stop_reason == "tool_use":
            # Add assistant message
            messages.append({"role": "assistant", "content": response.content})

            # Process each tool use
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    tool_calls += 1
                    try:
                        result = await connection.call_tool(block.name, block.input)
                        # Convert result to string
                        if isinstance(result, list):
                            result_text = "\n".join(
                                item.text if hasattr(item, 'text') else str(item)
                                for item in result
                            )
                        else:
                            result_text = str(result)
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": result_text
                        })
                    except Exception as e:
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": f"Error: {str(e)}",
                            "is_error": True
                        })

            messages.append({"role": "user", "content": tool_results})
        else:
            # Unexpected stop reason
            break

    return "Error: Max turns reached without answer", tool_calls


async def evaluate_single_task(
    client: anthropic.Anthropic,
    connection: MCPConnection,
    qa_pair: QAPair,
    model: str
) -> TaskResult:
    """Evaluate a single question-answer pair."""
    start_time = time.time()

    try:
        response, tool_calls = await agent_loop(
            client, connection, qa_pair.question, model
        )

        actual_answer = extract_answer(response)
        summary = extract_summary(response)
        feedback = extract_feedback(response)

        # Simple string comparison for correctness
        is_correct = actual_answer.lower().strip() == qa_pair.answer.lower().strip()

        duration = time.time() - start_time

        return TaskResult(
            question=qa_pair.question,
            expected_answer=qa_pair.answer,
            actual_answer=actual_answer,
            is_correct=is_correct,
            duration=duration,
            tool_calls=tool_calls,
            summary=summary,
            feedback=feedback
        )

    except Exception as e:
        duration = time.time() - start_time
        return TaskResult(
            question=qa_pair.question,
            expected_answer=qa_pair.answer,
            actual_answer=f"Error: {str(e)}",
            is_correct=False,
            duration=duration,
            tool_calls=0,
            summary="",
            feedback=""
        )


async def run_evaluation(
    connection: MCPConnection,
    qa_pairs: list[QAPair],
    model: str
) -> EvaluationReport:
    """Run the full evaluation."""
    client = anthropic.Anthropic()

    results = []
    for i, qa_pair in enumerate(qa_pairs, 1):
        print(f"Evaluating question {i}/{len(qa_pairs)}...", file=sys.stderr)
        result = await evaluate_single_task(client, connection, qa_pair, model)
        results.append(result)

        status = "✓" if result.is_correct else "✗"
        print(f"  {status} (took {result.duration:.1f}s, {result.tool_calls} tool calls)", file=sys.stderr)

    correct = sum(1 for r in results if r.is_correct)
    total_duration = sum(r.duration for r in results)
    total_tool_calls = sum(r.tool_calls for r in results)

    return EvaluationReport(
        total_tasks=len(qa_pairs),
        correct_tasks=correct,
        accuracy=correct / len(qa_pairs) * 100 if qa_pairs else 0,
        avg_duration=total_duration / len(qa_pairs) if qa_pairs else 0,
        total_tool_calls=total_tool_calls,
        results=results
    )


def generate_report(report: EvaluationReport) -> str:
    """Generate a markdown report from evaluation results."""
    lines = [
        "# MCP Server Evaluation Report",
        "",
        f"**Date**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "",
        "## Summary",
        "",
        f"- **Total Questions**: {report.total_tasks}",
        f"- **Correct Answers**: {report.correct_tasks}",
        f"- **Accuracy**: {report.accuracy:.1f}%",
        f"- **Average Duration**: {report.avg_duration:.1f}s",
        f"- **Total Tool Calls**: {report.total_tool_calls}",
        "",
        "## Results",
        ""
    ]

    for i, result in enumerate(report.results, 1):
        status = "✅" if result.is_correct else "❌"
        lines.extend([
            f"### Question {i} {status}",
            "",
            f"**Question**: {result.question}",
            "",
            f"**Expected**: {result.expected_answer}",
            "",
            f"**Actual**: {result.actual_answer}",
            "",
            f"**Duration**: {result.duration:.1f}s | **Tool Calls**: {result.tool_calls}",
            ""
        ])

        if result.summary:
            lines.extend([
                "**Summary**:",
                result.summary,
                ""
            ])

        if result.feedback:
            lines.extend([
                "**Feedback**:",
                result.feedback,
                ""
            ])

        lines.append("---")
        lines.append("")

    return "\n".join(lines)


async def main():
    parser = argparse.ArgumentParser(
        description="Evaluate an MCP server with a set of questions",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # stdio transport
  python evaluation.py eval.xml --transport stdio --command node --args dist/index.js

  # HTTP transport
  python evaluation.py eval.xml --transport http --url http://localhost:3000/mcp

  # SSE transport with headers
  python evaluation.py eval.xml --transport sse --url http://localhost:3000/sse --headers "Authorization: Bearer xxx"
"""
    )

    parser.add_argument("evaluation_file", help="Path to XML evaluation file")
    parser.add_argument("--transport", choices=["stdio", "sse", "http"], required=True,
                        help="Transport type")
    parser.add_argument("--command", help="Command to run (stdio)")
    parser.add_argument("--args", nargs="*", help="Command arguments (stdio)")
    parser.add_argument("--env", action="append", help="Environment variables KEY=VALUE (stdio)")
    parser.add_argument("--url", help="Server URL (sse/http)")
    parser.add_argument("--headers", action="append", help="HTTP headers KEY:VALUE (sse/http)")
    parser.add_argument("--model", default="claude-sonnet-4-20250514",
                        help="Claude model to use")
    parser.add_argument("--output", "-o", help="Output file for report (default: stdout)")

    args = parser.parse_args()

    # Parse environment variables
    env = {}
    if args.env:
        for e in args.env:
            key, value = e.split("=", 1)
            env[key] = value

    # Parse headers
    headers = {}
    if args.headers:
        for h in args.headers:
            key, value = h.split(":", 1)
            headers[key.strip()] = value.strip()

    # Load evaluation file
    qa_pairs = parse_evaluation_file(args.evaluation_file)
    print(f"Loaded {len(qa_pairs)} questions from {args.evaluation_file}", file=sys.stderr)

    # Create connection
    connection = create_connection(
        transport=args.transport,
        command=args.command,
        args=args.args,
        env=env if env else None,
        url=args.url,
        headers=headers if headers else None
    )

    # Run evaluation
    async with connection:
        tools = await connection.list_tools()
        print(f"Connected to server with {len(tools)} tools", file=sys.stderr)

        report = await run_evaluation(connection, qa_pairs, args.model)

    # Generate and output report
    report_text = generate_report(report)

    if args.output:
        with open(args.output, "w") as f:
            f.write(report_text)
        print(f"Report written to {args.output}", file=sys.stderr)
    else:
        print(report_text)

    # Exit with error code if not all correct
    sys.exit(0 if report.accuracy == 100 else 1)


if __name__ == "__main__":
    asyncio.run(main())
