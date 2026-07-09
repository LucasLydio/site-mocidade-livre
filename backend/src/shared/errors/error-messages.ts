export const errorMessages: Record<number, string> = {
  400: "Dados invalidos. Verifique as informacoes enviadas.",
  401: "Voce precisa estar autenticado para continuar.",
  403: "Voce nao possui acesso para realizar esta acao.",
  404: "Recurso nao encontrado.",
  409: "Ja existe um registro com essas informacoes.",
  422: "Nao foi possivel processar esta solicitacao.",
  429: "Muitas tentativas. Tente novamente em alguns minutos.",
  503: "Servico temporariamente indisponivel. Tente novamente em alguns instantes.",
  500: "Erro interno. Tente novamente mais tarde."
};
