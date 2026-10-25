# MENCARE — assistente de autocuidado masculino

Aplicação HTML estática em `index.html`: rotina diária, notificações enquanto a aba estiver aberta, mapa corporal SVG interativo e sugestões locais de produtos.

## Ativar recomendações por IA (opcional)

O aplicativo funciona sem IA externa, com recomendações baseadas em regras. Para conectar um modelo:

1. Crie um Cloudflare Worker usando o código de `worker/ai.js`.
2. No painel **Settings > Variables and Secrets** do Worker, adicione a variável secreta `OPENAI_API_KEY` (nunca no frontend). Essa API é um serviço pago por uso.
3. Opcionalmente, configure `ALLOWED_ORIGIN` com a origem HTTPS exata de publicação do app e `OPENAI_MODEL` com o modelo autorizado na sua conta.
4. Publique o Worker. Em **Assistente de produtos**, cole a URL HTTPS do Worker e clique em **Salvar endpoint**.
5. Clique em **Gerar minhas sugestões**. Se a API falhar, sugestões locais permanecem visíveis.

**Limitações de produção:** O Worker de exemplo não tem autenticação nem limite de requisições; por segurança e controle de custos, adicione rate limiting/autenticação antes de abrir ao público. O CORS restringe navegadores, mas não substitui autenticação. Para notificações quando a aba está fechada, implemente Web Push com service worker e servidor.

Os dados do perfil ficam no navegador, mas são enviados ao Worker quando a IA é acionada. Não use esse recurso para armazenar dados clínicos nem aconselhamento médico.
