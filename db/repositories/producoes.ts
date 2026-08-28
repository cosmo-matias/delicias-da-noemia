import { db } from "../client";
import { producoes, producoesInsumos, receitas, insumos } from "../schema";
import { eq, desc } from "drizzle-orm";

export const ProducoesRepository = {
  // Salvar uma produção vinculando os insumos gastos
  async salvarProducaoComInsumos(
    receitaId: number,
    data: string,
    rendimentoReal: number,
    custoTotalReal: number,
    observacoes: string | undefined,
    itensInsumos: {
      insumoId: number;
      quantidadeUtilizada: number;
      custoCalculado: number;
    }[]
  ) {
    return await db.transaction(async (tx) => {
      // Insere o registro principal da produção
      const [novaProducao] = await tx
        .insert(producoes)
        .values({
          receitaId,
          data,
          rendimentoReal,
          custoTotalReal,
          observacoes,
        })
        .returning();

      // Insere os insumos gastos na tabela pivot
      if (itensInsumos.length > 0) {
        const valoresInsumos = itensInsumos.map((item) => ({
          producaoId: novaProducao.id,
          insumoId: item.insumoId,
          quantidadeUtilizada: item.quantidadeUtilizada,
          custoCalculado: item.custoCalculado,
        }));

        await tx.insert(producoesInsumos).values(valoresInsumos);
      }

      return novaProducao;
    });
  },

  // Obter produção detalhada por ID
  async obterProducaoPorId(id: number) {
    // 1. Busca os dados principais e a receita atrelada
    const producao = await db
      .select({
        id: producoes.id,
        receitaId: producoes.receitaId,
        data: producoes.data,
        rendimentoReal: producoes.rendimentoReal,
        custoTotalReal: producoes.custoTotalReal,
        observacoes: producoes.observacoes,
        receitaNome: receitas.nome,
      })
      .from(producoes)
      .innerJoin(receitas, eq(producoes.receitaId, receitas.id))
      .where(eq(producoes.id, id))
      .get();

    if (!producao) return null;

    // 2. Busca os insumos gastos nesta produção
    const itens = await db
      .select({
        id: producoesInsumos.id,
        insumoId: producoesInsumos.insumoId,
        quantidadeUtilizada: producoesInsumos.quantidadeUtilizada,
        custoCalculado: producoesInsumos.custoCalculado,
        insumoNome: insumos.nome,
        insumoUnidade: insumos.unidadeMedida,
      })
      .from(producoesInsumos)
      .innerJoin(insumos, eq(producoesInsumos.insumoId, insumos.id))
      .where(eq(producoesInsumos.producaoId, id));

    return { ...producao, itens };
  },

  // Listar todas as produções (Histórico)
  async listarProducoes() {
    return await db
      .select({
        id: producoes.id,
        data: producoes.data,
        rendimentoReal: producoes.rendimentoReal,
        custoTotalReal: producoes.custoTotalReal,
        receitaNome: receitas.nome,
      })
      .from(producoes)
      .innerJoin(receitas, eq(producoes.receitaId, receitas.id))
      .orderBy(desc(producoes.id)); // Ordena do mais recente para o mais antigo
  },
  
  // Opcional: Deletar Produção
  async deletarProducao(id: number) {
    return await db.transaction(async (tx) => {
      await tx.delete(producoesInsumos).where(eq(producoesInsumos.producaoId, id));
      await tx.delete(producoes).where(eq(producoes.id, id));
      return true;
    });
  },

  // Obter o custo unitário da última produção registrada de uma receita
  async obterUltimoCustoProducao(receitaId: number): Promise<number | null> {
    const ultimaProducao = await db
      .select({
        custoTotalReal: producoes.custoTotalReal,
        rendimentoReal: producoes.rendimentoReal,
      })
      .from(producoes)
      .where(eq(producoes.receitaId, receitaId))
      .orderBy(desc(producoes.id))
      .limit(1)
      .get();

    if (!ultimaProducao || ultimaProducao.rendimentoReal <= 0) return null;
    return ultimaProducao.custoTotalReal / ultimaProducao.rendimentoReal;
  },
};

