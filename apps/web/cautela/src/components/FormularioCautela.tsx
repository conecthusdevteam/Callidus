import CampoSetor from "./CampoSetor";

export interface FieldErrors {
  setor?: string;
  nome?: string;
  email?: string;
  items?: string;
  retornado?: string;
  dataFim?: string;
}

function IconTrash() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 6h18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9 6V4h6v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 11v6M14 11v6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface FormularioCautelaProps {
  canCreateCautela: boolean;
  setorId: string;
  setSetorId: (v: string) => void;
  nome: string;
  setNome: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  descricao: string;
  setDescricao: (v: string) => void;
  quantidade: string;
  setQuantidade: (v: string) => void;
  items: { descricao: string; quantidade: number }[];
  setItems: React.Dispatch<
    React.SetStateAction<{ descricao: string; quantidade: number }[]>
  >;
  retornado: boolean | null;
  setRetornado: (v: boolean | null) => void;
  dataInicio: string;
  dataFim: string;
  setDataFim: (v: string) => void;
  fieldErrors: FieldErrors;
  submitError: string;
  submitting: boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  setItemParaExcluir: (i: number) => void;
  onCancel: () => void;
}

export default function FormularioCautela({
  canCreateCautela,
  setorId,
  setSetorId,
  nome,
  setNome,
  email,
  setEmail,
  descricao,
  setDescricao,
  quantidade,
  setQuantidade,
  items,
  setItems,
  retornado,
  setRetornado,
  dataInicio,
  dataFim,
  setDataFim,
  fieldErrors,
  submitError,
  submitting,
  handleSubmit,
  setItemParaExcluir,
  onCancel,
}: FormularioCautelaProps) {
  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {!canCreateCautela && (
        <p className="text-sm text-[#404040]">
          Seu perfil visualiza cautelas, mas não cria novas solicitações.
        </p>
      )}

      {/* Setor */}
      <div>
        <CampoSetor value={setorId} onSetorChange={(id) => setSetorId(id)} />
        {fieldErrors.setor && (
          <p className="text-red-500 text-xs mt-1">{fieldErrors.setor}</p>
        )}
      </div>

      {/* Proprietário */}
      <div>
        <label className="block font-medium text-black text-sm">
          Proprietário
        </label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className={`mt-1 w-full border-2 bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none ${
            fieldErrors.nome ? "border-red-400" : "border-[#D4D4D4]"
          }`}
          placeholder="Nome"
        />
        {fieldErrors.nome && (
          <p className="text-red-500 text-xs mt-1">{fieldErrors.nome}</p>
        )}
      </div>

      {/* E-mail */}
      <div>
        <label className="block font-medium text-black text-sm">
          E-mail do proprietário
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`mt-1 w-full border-2 bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none ${
            fieldErrors.email ? "border-red-400" : "border-[#D4D4D4]"
          }`}
          placeholder="@conecthus.org.br"
        />
        {fieldErrors.email && (
          <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
        )}
      </div>

      {/* Descrição + Quantidade */}
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <label className="block font-medium text-black text-sm">
            Descrição
          </label>
          <input
            type="text"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="mt-1 w-full border-2 border-[#D4D4D4] bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none h-[42px]"
            placeholder="value"
          />
        </div>
        <div className="w-28 flex-shrink-0">
          <label className="block font-medium text-black text-sm">
            Quantidade
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={quantidade}
            onChange={(e) =>
              setQuantidade(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            className="mt-1 w-full border-2 border-[#D4D4D4] bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none h-[42px]"
            placeholder="000"
          />
        </div>
      </div>

      {/* Botão adicionar */}
      <button
        type="button"
        onClick={() => {
          if (!descricao.trim()) {
            alert("Descrição obrigatória");
            return;
          }
          if (!quantidade || Number(quantidade) <= 0) {
            alert("Quantidade deve ser maior que 0");
            return;
          }
          setItems([...items, { descricao, quantidade: Number(quantidade) }]);
          setDescricao("");
          setQuantidade("");
        }}
        className="flex items-center gap-2 text-sm font-medium text-[#F9F9F9] bg-[#3BB14A] px-4 py-2 rounded-lg hover:bg-[#2B8E37]"
      >
        + Adicionar
      </button>

      {/* Tabela de itens */}
      {items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full mt-4 border border-gray-300 rounded-lg table-fixed">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left w-2/3 text-sm">Descrição</th>
                <th className="px-4 py-2 text-left w-1/6 text-sm">Qtd</th>
                <th className="px-4 py-2 text-center w-1/6 text-sm">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-t">
                  <td className="px-4 py-2 text-sm break-words">
                    {item.descricao}
                  </td>
                  <td className="py-2 text-center text-sm">
                    {item.quantidade}
                  </td>
                  <td className="py-2 text-center">
                    <button
                      type="button"
                      onClick={() => setItemParaExcluir(index)}
                      className="text-black hover:text-red-600"
                    >
                      <IconTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {fieldErrors.items && (
        <p className="text-red-500 text-xs mt-1">{fieldErrors.items}</p>
      )}

      {/* Retorno */}
      <div>
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-sm font-medium text-gray-700">
            O item será retornado?
          </p>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={retornado === true}
              onChange={() => setRetornado(retornado === true ? null : true)}
              className="h-4 w-4 text-green-600"
            />
            Sim
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={retornado === false}
              onChange={() => setRetornado(retornado === false ? null : false)}
              className="h-4 w-4 text-green-600"
            />
            Não
          </label>
        </div>
        {fieldErrors.retornado && (
          <p className="text-red-500 text-xs mt-1">{fieldErrors.retornado}</p>
        )}

        {retornado === true && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Validade da Cautela
            </p>
            <div className="flex gap-2">
              {/* Data início — somente leitura */}
              <input
                type="text"
                value={dataInicio}
                readOnly
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100"
              />
              {/* Data fim — com máscara DD/MM/AAAA */}
              <div className="flex-1">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="DD/MM/AAAA"
                  value={dataFim}
                  onChange={(e) => {
                    let v = e.target.value.replace(/\D/g, "").slice(0, 8);
                    if (v.length >= 5)
                      v =
                        v.slice(0, 2) + "/" + v.slice(2, 4) + "/" + v.slice(4);
                    else if (v.length >= 3)
                      v = v.slice(0, 2) + "/" + v.slice(2);
                    setDataFim(v);
                  }}
                  className={`w-full border bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none ${
                    fieldErrors.dataFim ? "border-red-400" : "border-gray-300"
                  }`}
                />
                {fieldErrors.dataFim && (
                  <p className="text-red-500 text-xs mt-1">
                    {fieldErrors.dataFim}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {submitError && (
        <p className="text-red-500 text-sm text-center">{submitError}</p>
      )}

      {/* Botões finais */}
      <div className="flex justify-center gap-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-[#F5F5F5] text-[#171717] text-sm font-medium hover:bg-gray-300"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!canCreateCautela || submitting}
          className="px-4 py-2 rounded-lg bg-[#FAFAFA] text-[#171717] text-sm font-medium hover:bg-[#3BB14A] hover:text-white disabled:opacity-60 disabled:hover:bg-[#FAFAFA] disabled:hover:text-[#171717]"
        >
          {submitting ? "Enviando..." : "Enviar"}
        </button>
      </div>
    </form>
  );
}
