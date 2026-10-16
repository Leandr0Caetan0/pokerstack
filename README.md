# Poker Stack — calculadora de fichas

Projeto com frontend React responsivo, API ASP.NET Core e projeto Android baseado em Capacitor.

## Regra de cálculo
- Cada kit tem 40 fichas de cada denominação: 1, 5, 10, 25 e 50 (200 fichas por kit).
- Total de stacks = jogadores + stacks reservados para rebuy (1, 2 ou 3).
- Quantidade de cada denominação por stack = `floor((kits × 40) / total de stacks)`.
- Valor por stack = quantidade por denominação × (1 + 5 + 10 + 25 + 50), ou seja, × 91.
- As sobras de cada denominação são mantidas fora dos stacks. Todos os stacks distribuídos têm composição e valor idênticos.

> Esse modo mantém a mesma quantidade de cada cor em todos os stacks, conforme o esquema pedido. Ele não tenta encontrar uma combinação diferente de cores para maximizar o valor por stack.

## Rodar no PC (Windows)
Requisitos: Node.js 20+ e .NET 8 SDK.

1. Abra um terminal na pasta `frontend` e execute:
   ```powershell
   npm install
   npm run build
   ```
2. Copie o conteúdo da pasta `frontend/dist` para `backend/PokerStack.Api/wwwroot` (crie `wwwroot` se necessário).
3. No terminal, entre em `backend/PokerStack.Api` e execute:
   ```powershell
   dotnet run --urls http://localhost:5080
   ```
4. Abra `http://localhost:5080` no navegador. A API de cálculo fica em `POST http://localhost:5080/api/calculate`.

Para desenvolvimento separado, execute `npm run dev` na pasta `frontend` e `dotnet run` na pasta do backend. O frontend calcula localmente e funciona sem conexão com a API.

## Gerar o APK Android
O ambiente de criação não inclui Android SDK/Gradle, então o APK precisa ser compilado em um PC com Android Studio instalado.

1. Instale Node.js 20+ e Android Studio (incluindo Android SDK).
2. No terminal, entre em `frontend` e rode:
   ```powershell
   npm install
   npm run build
   npx cap add android
   npx cap sync android
   npx cap open android
   ```
   Se o comando `npx cap add android` informar que a plataforma já existe, pule esse comando.
3. No Android Studio, aguarde a sincronização do Gradle e escolha **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
4. O APK de debug normalmente será gerado em `frontend/android/app/build/outputs/apk/debug/app-debug.apk`.

O app é offline para a calculadora: os cálculos são feitos no próprio aparelho. A conexão com a internet só é necessária para instalar dependências na etapa de preparação/compilação.

## API
`POST /api/calculate`
```json
{ "kits": 1, "players": 4, "rebuys": 1 }
```
A resposta inclui stacks totais, valor de cada stack, quantidade de fichas por denominação e sobras.
