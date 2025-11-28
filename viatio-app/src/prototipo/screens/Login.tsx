import { useState } from "react";
import { Mail, Lock } from "lucide-react";
import { PageContainer } from "./components/ui/page-container";
import { FormInput } from "./components/ui/form-input";
import { PrimaryButton } from "./components/ui/primary-button";
import { SecondaryButton } from "./components/ui/secondary-button";
import logoImage from "figma:asset/e7a86ab5e7a42323a8a6b7e2273513a1d00b8e21.png";

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Acceso directo sin validación
    onLogin();
  };

  return (
    <PageContainer>
      <div className="min-h-screen bg-gradient-to-br from-[#003580] via-[#0066CC] to-[#0052A3] flex flex-col">
        {/* Header Section */}
        <div className="px-6 pt-12 pb-12 text-center">
          <div className="w-44 h-44 mx-auto mb-6">
            <img 
              src={logoImage} 
              alt="Triptia Logo" 
              className="w-full h-full object-contain drop-shadow-[0_10px_40px_rgba(255,192,67,0.3)]"
            />
          </div>
          <h1 className="text-white text-6xl mb-4 tracking-tight">Triptia</h1>
          <p className="text-blue-100 text-lg opacity-90">Organiza tus viajes de forma inteligente</p>
        </div>

        {/* Login Card */}
        <div className="flex-1 bg-gray-50 rounded-t-[2.5rem] px-6 pt-10 pb-8 shadow-2xl">
          <div className="max-w-md mx-auto">
            <div className="mb-8">
              <h2 className="text-gray-900 mb-2">Bienvenido de nuevo</h2>
              <p className="text-gray-600">Inicia sesión para acceder a tus viajes</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm text-gray-700">
                  Correo electrónico
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-transparent transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-gray-700">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-transparent transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm pt-1">
                <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-[#0066CC] focus:ring-[#0066CC]"
                  />
                  <span>Recordarme</span>
                </label>
                <button type="button" className="text-[#0066CC] hover:text-[#0052A3] transition-colors">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#FFC043] to-[#FFB400] hover:from-[#FFB400] hover:to-[#FFA500] text-[#003580] py-4 rounded-2xl transition-all shadow-lg shadow-[#FFC043]/30 hover:shadow-xl hover:shadow-[#FFC043]/40 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Iniciar sesión
                </button>
              </div>

              <div className="relative my-7">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gray-50 text-gray-500">o continúa con</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 px-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Google</span>
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 px-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                >
                  <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Facebook</span>
                </button>
              </div>

              <div className="text-center pt-5">
                <p className="text-gray-600">
                  ¿No tienes cuenta?{" "}
                  <button type="button" className="text-[#0066CC] hover:text-[#0052A3] transition-colors">
                    Regístrate gratis
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}