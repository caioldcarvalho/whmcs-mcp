#!/usr/bin/env node

// Teste simples da nova funcionalidade sem usar MCP
const fs = require('fs');
const path = require('path');

// Simular os dados que coletamos
const sampleInvoices = [
  {
    id: 10815,
    userid: 111,
    invoicenum: "",
    date: "2025-09-17",
    duedate: "2025-02-15",
    total: "197.90",
    subtotal: "197.90",
    status: "Unpaid",
    paymentmethod: "banktransfer",
    currencycode: "BRL",
    currencyprefix: "R$ ",
    currencysuffix: ""
  },
  {
    id: 10827,
    userid: 111,
    invoicenum: "",
    date: "2025-09-18",
    duedate: "2025-03-15",
    total: "197.90",
    subtotal: "197.90",
    status: "Unpaid",
    paymentmethod: "banktransfer",
    currencycode: "BRL",
    currencyprefix: "R$ ",
    currencysuffix: ""
  }
];

const sampleClient = {
  firstname: "Diego",
  lastname: "Faria Martins",
  email: "diegofaria@staff.sourei.com.br",
  phonenumber: "35997132726"
};

const sampleProducts = [
  {
    pid: 198,
    name: "Iniciante I",
    description: "Plano de hospedagem básico",
    firstpaymentamount: "99.90"
  },
  {
    pid: 204,
    name: "Free",
    description: "Plano gratuito",
    firstpaymentamount: "0.00"
  }
];

function calculateDaysOverdue(dueDate) {
  if (!dueDate || dueDate === '0000-00-00') return 0;
  
  try {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = now.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  } catch {
    return 0;
  }
}

// Processar faturas como a nossa nova tool faria
const detailedInvoices = [];

for (const invoice of sampleInvoices) {
  const baseInvoiceData = {
    invoice_id: invoice.id,
    invoice_number: invoice.invoicenum || `INV-${invoice.id}`,
    client_id: invoice.userid,
    client_name: `${sampleClient.firstname} ${sampleClient.lastname}`,
    client_email: sampleClient.email,
    client_phone: sampleClient.phonenumber,
    invoice_total: `${invoice.currencyprefix}${invoice.total}${invoice.currencysuffix}`,
    invoice_subtotal: `${invoice.currencyprefix}${invoice.subtotal}${invoice.currencysuffix}`,
    invoice_status: invoice.status,
    invoice_date: invoice.date,
    invoice_duedate: invoice.duedate,
    payment_method: invoice.paymentmethod || 'Não especificado',
    currency_code: invoice.currencycode || 'BRL',
    days_overdue: calculateDaysOverdue(invoice.duedate)
  };

  // Adicionar uma linha para cada produto
  for (const product of sampleProducts) {
    detailedInvoices.push({
      ...baseInvoiceData,
      product_id: product.pid,
      product_name: product.name,
      product_description: product.description,
      line_total: `${invoice.currencyprefix}${product.firstpaymentamount}${invoice.currencysuffix}`
    });
  }
}

// Gerar resultado final
const result = {
  result: 'success',
  summary: {
    total_unpaid_invoices: sampleInvoices.length,
    total_detail_lines: detailedInvoices.length,
    total_amount_unpaid: `R$ ${sampleInvoices.reduce((sum, inv) => sum + parseFloat(inv.total), 0).toFixed(2)}`,
    processed_at: new Date().toISOString()
  },
  invoices: detailedInvoices
};

console.log('\n=== RESULTADO DA NOVA TOOL: FATURAS NÃO PAGAS COMPLETAS ===\n');
console.log(JSON.stringify(result, null, 2));

// Gerar CSV para exemplo
const csvLines = [
  'invoice_id,invoice_number,client_id,client_name,client_email,client_phone,product_id,product_name,product_description,line_total,invoice_total,invoice_status,invoice_date,invoice_duedate,days_overdue,payment_method'
];

for (const invoice of detailedInvoices) {
  csvLines.push([
    invoice.invoice_id,
    invoice.invoice_number,
    invoice.client_id,
    `"${invoice.client_name}"`,
    invoice.client_email,
    invoice.client_phone,
    invoice.product_id,
    `"${invoice.product_name}"`,
    `"${invoice.product_description}"`,
    invoice.line_total,
    invoice.invoice_total,
    invoice.invoice_status,
    invoice.invoice_date,
    invoice.invoice_duedate,
    invoice.days_overdue,
    invoice.payment_method
  ].join(','));
}

const csvContent = csvLines.join('\n');
fs.writeFileSync('/home/caio/workspace/whmcs-mcp/faturas_nao_pagas_exemplo.csv', csvContent);

console.log('\n=== ARQUIVO CSV GERADO ===');
console.log('Arquivo: faturas_nao_pagas_exemplo.csv');
console.log('Primeiras linhas do CSV:');
console.log(csvLines.slice(0, 4).join('\n'));