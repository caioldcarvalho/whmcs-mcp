# Funções WHMCS - Separação GET vs Ações

## Da lista que você mostrou, aqui estão as funções separadas:

### ✅ Funções GET (já implementamos 10 delas!)

**Já Implementadas:**
1. GetTickets ✅
2. GetTicket ✅
3. GetTicketCounts ✅
4. GetSupportDepartments ✅
5. GetSupportStatuses ✅ (chamado GetSupportStatuses na API)
6. GetClients ✅
7. GetClientsDetails ✅
8. GetProducts ✅
9. GetOrders ✅
10. GetInvoices ✅

**Ainda faltam (da sua lista):**
11. GetTicketAttachment
12. GetTicketNotes (chamado GetTicketNotes na API)
13. GetTicketPredefinedReplies
14. GetAnnouncements
15. GetClientGroups
16. GetClientsDomains
17. GetClientsProducts
18. GetActivityLog
19. GetAdminDetails
20. GetAdminUsers
21. GetAutomationLog
22. GetCancelledPackages
23. GetContacts
24. GetCredits
25. GetCurrencies
26. GetEmails
27. GetEmailTemplates
28. GetHealthStatus
29. GetModuleConfigurationParameters
30. GetModuleQueue
31. GetPaymentMethods
32. GetProject
33. GetPromotions
34. GetServers
35. GetStats
36. GetStaffOnline
37. GetToDoItems (chamado GetToDoItems na API)
38. GetToDoItemStatuses
39. GetUsers
40. GetAffiliates

---

## ⚡ Funções de AÇÃO (Não-GET) - Da sua lista

### Tickets e Suporte
1. **AddTicketNote** - Adicionar nota a ticket
2. **AddTicketReply** - Responder ticket ✅ (JÁ IMPLEMENTADO)
3. **BlockTicketSender** - Bloquear remetente de ticket
4. **CreateSsoToken** - Criar token SSO
5. **DeleteTicket** - Excluir ticket
6. **DeleteTicketNote** - Excluir nota de ticket
7. **DeleteTicketReply** - Excluir resposta de ticket
8. **MergeTicket** - Mesclar tickets
9. **OpenTicket** - Criar ticket ✅ (JÁ IMPLEMENTADO)
10. **UpdateTicket** - Atualizar ticket ✅ (JÁ IMPLEMENTADO)
11. **UpdateTicketReply** - Atualizar resposta de ticket

### Clientes
12. **ActivateModule** - Ativar módulo
13. **DeactivateModule** - Desativar módulo

### Domínios
14. **DomainGetLockingStatus** - Status de bloqueio de domínio
15. **DomainGetNameservers** - Nameservers de domínio

### Módulos
16. **ModuleChangePackage** - Mudar pacote de módulo
17. **ModuleChangePw** - Mudar senha de módulo
18. **ModuleCreate** - Criar módulo
19. **ModuleSuspend** - Suspender módulo
20. **ModuleTerminate** - Terminar módulo
21. **ModuleUnsuspend** - Reativar módulo
22. **ModuleCustom** - Ação customizada de módulo

### Produtos
23. **UpgradeProduct** - Upgrade de produto

### Outros
24. **ValidateLogin** - Validar login
25. **AffiliateActivate** - Ativar afiliado
26. **GenInvoices** - Gerar faturas

---

## 📊 Resumo

### Funções GET
- **Total disponíveis**: ~50
- **Implementadas**: 10 ✅
- **Faltam**: ~40

### Funções de Ação (não-GET)
- **Total disponíveis**: ~26 (da sua lista)
- **Implementadas**: 3 ✅ (OpenTicket, AddTicketReply, UpdateTicket)
- **Faltam**: ~23

---

## 🎯 Recomendações de Implementação

### Alta Prioridade - GETs restantes
1. **GetTicketNotes** - Buscar notas de tickets
2. **GetClientsProducts** - Produtos de um cliente
3. **GetClientsDomains** - Domínios de um cliente
4. **GetActivityLog** - Log de atividades
5. **GetStats** - Estatísticas gerais
6. **GetCurrencies** - Moedas

### Alta Prioridade - Ações
1. **AddTicketNote** - Adicionar nota interna (importante para workflow)
2. **DeleteTicket** - Excluir tickets
3. **MergeTicket** - Mesclar tickets duplicados
4. **BlockTicketSender** - Bloquear spam

### Média Prioridade - GETs
1. **GetPaymentMethods** - Métodos de pagamento
2. **GetAdminUsers** - Lista admins
3. **GetEmails** - Emails enviados
4. **GetPromotions** - Promoções
5. **GetServers** - Servidores

### Média Prioridade - Ações
1. **ModuleSuspend** / **ModuleUnsuspend** - Suspender/reativar serviços
2. **ModuleTerminate** - Terminar serviços
3. **GenInvoices** - Gerar faturas
4. **DeleteTicketReply** - Excluir respostas

### Baixa Prioridade
1. **GetToDoItems** / **GetToDoItemStatuses**
2. **GetAffiliates** / **AffiliateActivate**
3. **GetHealthStatus**
4. **GetStaffOnline**

---

## 💡 Próximo Passo Sugerido

Você prefere:

1. **Completar mais GETs** (mais 5-10 funções de leitura)?
2. **Implementar ações importantes** (AddTicketNote, DeleteTicket, MergeTicket)?
3. **Focar em um módulo específico** (ex: completar TUDO de tickets)?

O que faz mais sentido para o seu caso de uso?
