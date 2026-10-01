import React, { useState } from 'react';
import { ShieldCheck, X, KeyRound } from 'lucide-react';

interface TwoFactorModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

export const TwoFactorModal: React.FC<TwoFactorModalProps> = ({
  isOpen,
  onSuccess,
  onClose,
}) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newCode = [...code];
    newCode[index] = val.slice(-1);
    setCode(newCode);

    // Auto-advance
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerify = () => {
    const fullCode = code.join('');
    if (fullCode.length === 6) {
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400 mx-auto mb-4">
          <ShieldCheck className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-slate-100">Autenticação em Dois Fatores (2FA)</h3>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          Camada de segurança simulada (RF-002). Digite o código de 6 dígitos gerado pelo seu aplicativo autenticador.
        </p>

        <div className="flex justify-center gap-2 my-6">
          {code.map((digit, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              className="w-10 h-12 text-center text-lg font-mono font-bold bg-slate-950 border border-slate-700 rounded-lg text-emerald-400 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-red-400 mb-4">
            Por favor, preencha os 6 dígitos do código simulado.
          </p>
        )}

        <button
          type="button"
          onClick={handleVerify}
          className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 cursor-pointer shadow-xs"
        >
          Validar e Prosseguir
        </button>

        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <KeyRound className="w-3.5 h-3.5" />
          <span>Dica Demo: Qualquer 6 dígitos serão aceitos.</span>
        </div>
      </div>
    </div>
  );
};
