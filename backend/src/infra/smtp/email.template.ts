export function welcomeTemplate(name: string): string {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f2937;">
      <h1 style="font-size: 20px;">Bem-vindo a Mocidade Livre</h1>
      <p>Ola, ${name}.</p>
      <p>Sua conta foi criada com sucesso.</p>
    </div>
  `;
}

