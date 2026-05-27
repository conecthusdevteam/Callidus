import CampoSetor from "./CampoSetor";

export interface FieldErrors {
  setor?: string;
  nome?: string;
  email?: string;
  documento?: string;
  empresa?: string;
  descricao?: string;
  quantidade?: string;
  items?: string;
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
  validarDocumento: (documento: string) => boolean;
  setorId: string;
  setSetorId: (v: string) => void;
  nome: string;
  setNome: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  documento: string;
  setDocumento: (v: string) => void;
  empresa: string;
  setEmpresa: (v: string) => void;
  descricao: string;
  setDescricao: (v: string) => void;
  quantidade: string;
  setQuantidade: (v: string) => void;
  items: { descricao: string; quantidade: number }[];
  setItems: React.Dispatch<
    React.SetStateAction<{ descricao: string; quantidade: number }[]>
  >;
  fieldErrors: FieldErrors;
  setFieldErrors: React.Dispatch<React.SetStateAction<FieldErrors>>;
  submitError: string;
  submitting: boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  setItemParaExcluir: (i: number) => void;
  onCancel: () => void;
}

export default function FormularioCautela({
  canCreateCautela,
  validarDocumento,
  setorId,
  setSetorId,
  nome,
  setNome,
  email,
  setEmail,
  documento,
  setDocumento,
  empresa,
  setEmpresa,
  descricao,
  setDescricao,
  quantidade,
  setQuantidade,
  items,
  setItems,
  fieldErrors,
  setFieldErrors,
  submitError,
  submitting,
  handleSubmit,
  setItemParaExcluir,
  onCancel,
}: FormularioCautelaProps) {
  const dominiosPermitidos = ["@callidus.org.br", "@conecthus.org.br"];
  const dominioAtual =
    dominiosPermitidos.find((dominio) => email.endsWith(dominio)) ??
    "@callidus.org.br";
  const emailLocal = email.endsWith(dominioAtual)
    ? email.slice(0, -dominioAtual.length)
    : (email.split("@")[0] ?? "");

  function validarEmailInstitucional(value: string) {
    return /^[A-Za-z0-9._%+-]+@(callidus|conecthus)\.org\.br$/i.test(value);
  }

  function atualizarEmail(local: string, dominio = dominioAtual) {
    const sanitizedLocal = local.replace(/@.*/, "");
    const nextEmail = sanitizedLocal ? `${sanitizedLocal}${dominio}` : "";
    setEmail(nextEmail);

    if (!nextEmail.trim()) {
      setFieldErrors((prev) => ({
        ...prev,
        email: "O campo E-mail é obrigatório.",
      }));
    } else if (!validarEmailInstitucional(nextEmail)) {
      setFieldErrors((prev) => ({
        ...prev,
        email: "Use apenas e-mail institucional.",
      }));
    } else {
      setFieldErrors((prev) => {
        const n = { ...prev };
        delete n.email;
        return n;
      });
    }
  }

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
          onChange={(e) => {
            const value = e.target.value;
            setNome(value);
            if (!value.trim()) {
              setFieldErrors((prev) => ({
                ...prev,
                nome: "O campo Proprietário é obrigatório.",
              }));
            } else if (value.trim().length < 3) {
              setFieldErrors((prev) => ({
                ...prev,
                nome: "O nome deve ter no mínimo 3 caracteres.",
              }));
            } else {
              setFieldErrors((prev) => {
                const n = { ...prev };
                delete n.nome;
                return n;
              });
            }
          }}
          onBlur={() => {
            if (!nome.trim()) {
              setFieldErrors((prev) => ({
                ...prev,
                nome: "O campo Proprietário é obrigatório.",
              }));
            } else if (nome.trim().length < 3) {
              setFieldErrors((prev) => ({
                ...prev,
                nome: "O nome deve ter no mínimo 3 caracteres.",
              }));
            }
          }}
          className={`mt-1 w-full border-2 bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none ${
            fieldErrors.nome ? "border-red-400" : "border-[#D4D4D4]"
          }`}
          placeholder="Nome"
        />
        {fieldErrors.nome && (
          <p className="text-red-500 text-xs mt-1">{fieldErrors.nome}</p>
        )}
      </div>

      {/* Documento */}
      <div>
        <label className="block font-medium text-black text-sm">
          Documento{" "}
          <span className="font-normal text-gray-500">(Identidade ou CPF)</span>
        </label>
        <input
          type="text"
          value={documento}
          onChange={(e) => {
            const valor = e.target.value.replace(/\D/g, "").slice(0, 14);
            setDocumento(valor);
            if (!valor.trim()) {
              setFieldErrors((prev) => ({
                ...prev,
                documento: "O campo Documento é obrigatório.",
              }));
            } else if (!validarDocumento(valor)) {
              setFieldErrors((prev) => ({
                ...prev,
                documento: "Informe um CPF ou identidade válida",
              }));
            } else {
              setFieldErrors((prev) => {
                const n = { ...prev };
                delete n.documento;
                return n;
              });
            }
          }}
          onBlur={() => {
            if (!documento.trim()) {
              setFieldErrors((prev) => ({
                ...prev,
                documento: "O campo Documento é obrigatório.",
              }));
            } else if (!validarDocumento(documento)) {
              setFieldErrors((prev) => ({
                ...prev,
                documento: "Informe um CPF ou identidade válida",
              }));
            }
          }}
          className={`mt-1 w-full border-2 bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none ${
            fieldErrors.documento ? "border-red-400" : "border-[#D4D4D4]"
          }`}
          placeholder="Adicione Identidade ou CPF"
        />
        {fieldErrors.documento && (
          <p className="text-red-500 text-xs mt-1">{fieldErrors.documento}</p>
        )}
      </div>

      {/* Empresa */}
      <div>
        <label className="block font-medium text-black text-sm">Empresa</label>
        <input
          type="text"
          value={empresa}
          onChange={(e) => {
            const value = e.target.value;
            setEmpresa(value);
            if (!value.trim()) {
              setFieldErrors((prev) => ({
                ...prev,
                empresa: "O campo Empresa é obrigatório.",
              }));
            } else {
              setFieldErrors((prev) => {
                const n = { ...prev };
                delete n.empresa;
                return n;
              });
            }
          }}
          onBlur={() => {
            if (!empresa.trim()) {
              setFieldErrors((prev) => ({
                ...prev,
                empresa: "O campo Empresa é obrigatório.",
              }));
            }
          }}
          className={`mt-1 w-full border-2 bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none ${
            fieldErrors.empresa ? "border-red-400" : "border-[#D4D4D4]"
          }`}
          placeholder="Nome da empresa"
        />
        {fieldErrors.empresa && (
          <p className="text-red-500 text-xs mt-1">{fieldErrors.empresa}</p>
        )}
      </div>

      {/* E-mail */}
      <div>
        <label className="block font-medium text-black text-sm">
          E-mail do proprietário
        </label>
        <div className="mt-1 flex gap-2">
          <input
            type="text"
            value={emailLocal}
            onChange={(e) => atualizarEmail(e.target.value)}
            onBlur={() => {
              if (!email.trim()) {
                setFieldErrors((prev) => ({
                  ...prev,
                  email: "O campo E-mail é obrigatório.",
                }));
              } else if (!validarEmailInstitucional(email)) {
                setFieldErrors((prev) => ({
                  ...prev,
                  email: "Use apenas e-mail institucional.",
                }));
              }
            }}
            className={`min-w-0 flex-1 border-2 bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none ${
              fieldErrors.email ? "border-red-400" : "border-[#D4D4D4]"
            }`}
            placeholder="usuario"
          />
          <select
            value={dominioAtual}
            onChange={(e) => atualizarEmail(emailLocal, e.target.value)}
            className="w-[180px] border-2 border-[#D4D4D4] bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none"
          >
            {dominiosPermitidos.map((dominio) => (
              <option key={dominio} value={dominio}>
                {dominio}
              </option>
            ))}
          </select>
        </div>
        <input type="hidden" value={email} readOnly />
        {fieldErrors.email && (
          <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
        )}
      </div>

      {/* Descrição + Quantidade */}
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <label className="block font-medium text-black text-sm">
            Descrição de Material
          </label>
          <input
            type="text"
            value={descricao}
            onChange={(e) => {
              const value = e.target.value;
              setDescricao(value);
              if (!value.trim()) {
                setFieldErrors((prev) => ({
                  ...prev,
                  descricao: "A descrição do material é obrigatória.",
                }));
              } else if (value.trim().length < 3) {
                setFieldErrors((prev) => ({
                  ...prev,
                  descricao: "A descrição deve ter no mínimo 3 caracteres.",
                }));
              } else {
                setFieldErrors((prev) => {
                  const n = { ...prev };
                  delete n.descricao;
                  return n;
                });
              }
            }}
            onBlur={() => {
              if (!descricao.trim()) {
                setFieldErrors((prev) => ({
                  ...prev,
                  descricao: "A descrição do material é obrigatória.",
                }));
              } else if (descricao.trim().length < 3) {
                setFieldErrors((prev) => ({
                  ...prev,
                  descricao: "A descrição deve ter no mínimo 3 caracteres.",
                }));
              }
            }}
            className={`mt-1 w-full border-2 bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none h-[42px] ${
              fieldErrors.descricao ? "border-red-400" : "border-[#D4D4D4]"
            }`}
            placeholder="Item"
          />
          {fieldErrors.descricao && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.descricao}</p>
          )}
        </div>
        <div className="w-28 flex-shrink-0">
          <label className="block font-medium text-black text-sm">
            Quantidade
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={quantidade}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 6);
              setQuantidade(value);
              if (!value || Number(value) <= 0) {
                setFieldErrors((prev) => ({
                  ...prev,
                  quantidade: "A quantidade deve ser maior que 0.",
                }));
              } else {
                setFieldErrors((prev) => {
                  const n = { ...prev };
                  delete n.quantidade;
                  return n;
                });
              }
            }}
            className={`mt-1 w-full border-2 bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none h-[42px] ${
              fieldErrors.quantidade ? "border-red-400" : "border-[#D4D4D4]"
            }`}
            placeholder="000"
          />
          {fieldErrors.quantidade && (
            <p className="text-red-500 text-xs mt-1">
              {fieldErrors.quantidade}
            </p>
          )}
        </div>
      </div>

      {/* Botão adicionar */}
      <button
        type="button"
        onClick={() => {
          const erros: FieldErrors = {};

          if (!descricao.trim()) {
            erros.descricao = "A descrição do material é obrigatória.";
          } else if (descricao.trim().length < 3) {
            erros.descricao = "A descrição deve ter no mínimo 3 caracteres.";
          }

          if (!quantidade || Number(quantidade) <= 0) {
            erros.quantidade = "A quantidade deve ser maior que 0.";
          }

          if (Object.keys(erros).length > 0) {
            setFieldErrors((prev) => ({ ...prev, ...erros }));
            return;
          }

          setItems([...items, { descricao, quantidade: Number(quantidade) }]);
          setDescricao("");
          setQuantidade("");
          setFieldErrors((prev) => {
            const next = { ...prev };
            delete next.descricao;
            delete next.quantidade;
            return next;
          });
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
