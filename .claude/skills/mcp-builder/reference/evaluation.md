# MCP Server Evaluation Guide

## Overview

The measure of quality of an MCP server is NOT how well or comprehensively the server implements tools, but how well these implementations enable LLMs with no other context and access ONLY to the MCP servers to answer realistic and difficult questions.

This guide provides comprehensive instructions for creating and running evaluations of MCP servers.

---

## Core Requirements

Create **10 questions** that meet ALL of the following criteria:

### Question Requirements

1. **Independent**: Each question must be answerable without reference to other questions
2. **Read-only**: Questions must only require non-destructive, read-only operations
3. **Complex**: Questions should require multiple tool calls and deep exploration
4. **Realistic**: Based on real use cases that humans would actually care about
5. **Verifiable**: Single, clear answer that can be verified by string comparison
6. **Stable**: Answer must not change over time (use historical/closed data)

### Answer Requirements

- Answers must be verifiable through direct string comparison
- Prefer human-readable formats (names, URLs) over opaque IDs
- Answers must be STABLE/STATIONARY - based on closed concepts unlikely to change
- Avoid dynamic metrics like "current open issues" that change constantly

---

## Question Development Process

Follow these five steps to create effective evaluations:

### Step 1: Documentation Inspection

Review the MCP server's documentation to understand:
- Available tools and their capabilities
- Data structures and relationships
- Authentication and access patterns

### Step 2: Tool Inspection

List all available tools and understand:
- Input parameters and constraints
- Output formats and structures
- Tool relationships and dependencies

### Step 3: Develop Understanding

Build a mental model of:
- What data is accessible
- How tools can be composed
- What complex queries are possible

### Step 4: Read-Only Content Inspection

Use READ-ONLY operations to explore:
- Available data and its structure
- Relationships between entities
- Historical/stable data points

### Step 5: Task Generation

Create questions that:
- Stress-test tools by requiring understanding of multiple data modalities
- Use synonyms and paraphrases (avoid keyword-matching)
- Require synthesis across multiple information sources
- Cannot be solved with simple keyword searches

---

## Question Guidelines

### Good Questions

Questions should require:
- Multiple tool calls to answer
- Understanding of data relationships
- Synthesis of information from multiple sources
- Deep exploration of available data

### Avoid

- Questions solvable through straightforward keyword matching
- Questions with dynamic/changing answers
- Questions requiring write operations
- Questions dependent on other questions

### Data Types to Test

Stress-test tools by requiring understanding of:
- IDs and names
- Timestamps and datetimes
- URLs, GIDs, etc.
- Relationships between entities

---

## Answer Guidelines

### Format Requirements

- Answers must support direct string comparison
- Use human-readable formats when possible:
  - Usernames instead of user IDs
  - Dates in specified formats
  - Simple counts or multiple-choice responses

### Stability Requirements

- Answers must be based on "closed" historical data
- Avoid metrics that change over time
- Use specific historical events or states

---

## Output Format

Create an XML file with this structure:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<evaluation>
  <qa_pair>
    <question>Your complex question here?</question>
    <answer>Expected answer</answer>
  </qa_pair>
  <qa_pair>
    <question>Another complex question?</question>
    <answer>Expected answer</answer>
  </qa_pair>
  <!-- ... 10 qa_pairs total -->
</evaluation>
```

---

## Running Evaluations

### Using the Evaluation Harness

The evaluation harness supports three transport types:

#### stdio Transport (Local)

```bash
python evaluation.py eval.xml \
  --transport stdio \
  --command "node" \
  --args "dist/index.js" \
  --env "API_KEY=xxx"
```

#### SSE Transport

```bash
python evaluation.py eval.xml \
  --transport sse \
  --url "http://localhost:3000/sse" \
  --headers "Authorization: Bearer xxx"
```

#### HTTP Transport (Streamable HTTP)

```bash
python evaluation.py eval.xml \
  --transport http \
  --url "http://localhost:3000/mcp" \
  --headers "Authorization: Bearer xxx"
```

### Output Options

- `--output report.md`: Save report to file
- `--model claude-sonnet-4-20250514`: Specify Claude model
- Default output is to stdout

---

## Evaluation Metrics

The harness generates reports including:

- **Accuracy**: Percentage of correctly answered questions
- **Task Duration**: Average time per question
- **Tool Usage**: Number and types of tool calls
- **Per-Question Analysis**: Detailed breakdown with Claude's reasoning

---

## Example Questions

Here are examples of well-constructed evaluation questions:

```xml
<qa_pair>
  <question>Find discussions about AI model launches with animal codenames. One model needed a specific safety designation that uses the format ASL-X. What number X was being determined for the model named after a spotted wild cat?</question>
  <answer>3</answer>
</qa_pair>

<qa_pair>
  <question>In the repository's commit history from Q1 2024, which contributor made the most commits to files in the /src/utils directory? Provide their GitHub username.</question>
  <answer>johndoe</answer>
</qa_pair>

<qa_pair>
  <question>Looking at closed issues from 2023 labeled "bug" and "high-priority", what was the average resolution time in days (rounded to nearest whole number)?</question>
  <answer>7</answer>
</qa_pair>
```

---

## Iterative Improvement

Use evaluation results to:

1. **Identify Tool Gaps**: Questions that can't be answered may indicate missing tools
2. **Improve Descriptions**: Confusion may indicate unclear tool documentation
3. **Optimize Responses**: Poor performance may indicate verbose or unclear responses
4. **Add Error Handling**: Failures may reveal edge cases needing better error messages

Run evaluations regularly during development to ensure continuous improvement.
