// Shown when Firebase env vars are missing — gives clear setup instructions.
import { AlertTriangle } from "lucide-react";

export const FirebaseSetupNotice = () => (
  <div
    data-testid="firebase-setup-notice"
    className="min-h-screen flex items-center justify-center bg-[#0B0B0B] p-6"
  >
    <div className="max-w-xl w-full bg-[#141414] border border-white/10 rounded-2xl p-8 shadow-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#DC143C]/15 border border-[#DC143C]/40 flex items-center justify-center">
          <AlertTriangle size={20} className="text-[#DC143C]" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Firebase setup required
        </h1>
      </div>
      <p className="text-[#8A8A8E] leading-relaxed mb-4">
        NetNest uses Firebase Auth + Firestore. Add your Firebase web config to{" "}
        <code className="text-white bg-white/5 px-1.5 py-0.5 rounded">/app/frontend/.env</code>{" "}
        and restart the frontend.
      </p>
      <pre className="bg-black/60 border border-white/5 rounded-lg p-4 text-xs text-[#cfcfcf] overflow-x-auto">
{`REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=`}
      </pre>
      <p className="text-xs text-[#555] mt-4">
        Then enable Email/Password and Phone sign-in providers in the Firebase Console.
      </p>
    </div>
  </div>
);

export default FirebaseSetupNotice;
