/** Login con Google Identity Services: el botón oficial devuelve un ID token que valida el servidor. */
export const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) || ''

interface GoogleId {
  initialize(options: { client_id: string; callback: (r: { credential: string }) => void; ux_mode?: 'popup' }): void
  renderButton(element: HTMLElement, options: Record<string, unknown>): void
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } }
  }
}

let loading: Promise<GoogleId> | undefined

function loadScript(): Promise<GoogleId> {
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => (window.google ? resolve(window.google.accounts.id) : reject(new Error('GIS no disponible')))
    script.onerror = () => {
      loading = undefined
      reject(new Error('No se ha podido cargar Google'))
    }
    document.head.append(script)
  })
  return loading
}

export async function renderGoogleButton(
  element: HTMLElement,
  options: { dark: boolean; locale: string; width: number; onCredential: (credential: string) => void },
) {
  const gis = await loadScript()
  gis.initialize({ client_id: GOOGLE_CLIENT_ID, callback: (r) => options.onCredential(r.credential), ux_mode: 'popup' })
  gis.renderButton(element, {
    type: 'standard',
    theme: options.dark ? 'filled_black' : 'outline',
    size: 'large',
    text: 'continue_with',
    shape: 'pill',
    locale: options.locale,
    width: options.width,
  })
}
