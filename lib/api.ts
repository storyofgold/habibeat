// Data layer seam. The UI only ever talks to `api`.
// To swap database providers, replace the import below with another provider
// that exports the same function names (see ./providers/firebase.ts).
import { firebaseProvider } from './providers/firebase';

export const api = firebaseProvider;
