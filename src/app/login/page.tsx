import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { KeyRound, User, AlertCircle } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-blue-600 p-4 rounded-[2rem] shadow-xl shadow-blue-500/20">
            <KeyRound className="text-white" size={32} strokeWidth={2.5} />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-black text-gray-900 tracking-tight">
          Cellnet Szerviz
        </h2>
        <p className="mt-2 text-center text-sm font-bold text-gray-400 uppercase tracking-widest">
          Technikusi Belépés
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-4 shadow-2xl shadow-blue-500/5 sm:rounded-[2.5rem] sm:px-12 border border-gray-100">
          <form
            action={async (formData) => {
              "use server";
              try {
                await signIn("credentials", formData);
              } catch (error) {
                if (error instanceof AuthError) {
                  return Response.redirect(new URL("/login?error=Invalid credentials", process.env.AUTH_URL || "http://localhost:3000"));
                }
                throw error;
              }
            }}
            className="space-y-6"
          >
            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm font-bold animate-shake">
                <AlertCircle size={18} strokeWidth={3} />
                <span>Hibás adatok!</span>
              </div>
            )}

            <div>
              <label
                htmlFor="username"
                className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1"
              >
                Felhasználónév
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                  <User size={20} />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="block w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-gray-700"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1"
              >
                Jelszó
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                  <KeyRound size={20} />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="block w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-gray-700"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl shadow-blue-500/20 text-sm font-black text-white bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
              >
                Bejelentkezés
              </button>
            </div>
            
            <p className="text-center text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em] mt-8">
              Secure Session (30 nap)
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
