# Fluency

Tutor pessoal de conversação em inglês com transcrição por voz, correções leves e respostas faladas. A configuração local usa a assinatura do ChatGPT do proprietário.

## Ativar a IA pela primeira vez

As credenciais ficam no armazenamento seguro do sistema e não entram no projeto.

```powershell
npm exec -- eve dev
```

No console interativo, digite `/login` e escolha **ChatGPT Subscription**. Autorize a conta no navegador caso o eve solicite.

Depois do login, encerre o console com `/exit`.

> Esse modo é pessoal e local. A assinatura do ChatGPT não fornece uma chave de API reutilizável e não deve ser compartilhada com outros usuários. Para publicar um SaaS, troque para uma credencial da OpenAI API ou do Vercel AI Gateway.

## Abrir a aplicação

```powershell
npm run dev:web
```

Abra [http://localhost:3000](http://localhost:3000) no Chrome ou Edge e permita o microfone quando quiser praticar falando.

## Como funciona

- O navegador transcreve uma fala em inglês e envia somente o texto ao tutor.
- O tutor corrige no máximo dois pontos importantes e continua o assunto.
- A resposta é lida em voz alta pelo navegador; o botão de som permite silenciá-la.
- Também é possível digitar e escolher temas rápidos na tela inicial.

## Verificação

```powershell
npm run typecheck
npm run build:web
```
