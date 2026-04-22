interface Props {
  title: string
  message: string
  detail?: string
  onRetry: () => void
}

export function WebGLErrorScreen({ title, message, detail, onRetry }: Props) {
  const diag = collectDiagnostics()
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0b0f1a',
        color: '#e8eefc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 12,
        padding: 20,
        textAlign: 'left',
        fontFamily: 'inherit',
        overflow: 'auto',
      }}
    >
      <h2 style={{ color: '#ff8080', margin: '8px 0 0' }}>{title}</h2>
      <div style={{ maxWidth: 480 }}>{message}</div>
      {detail && (
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            background: '#000',
            border: '1px solid #333',
            borderRadius: 6,
            padding: 10,
            fontSize: 12,
            color: '#ffc0c0',
            maxWidth: '95vw',
            width: '100%',
          }}
        >
          {detail}
        </pre>
      )}
      <details style={{ maxWidth: '95vw', width: '100%', opacity: 0.85 }} open>
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Diagnostics</summary>
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            background: '#000',
            border: '1px solid #333',
            borderRadius: 6,
            padding: 10,
            fontSize: 11,
            marginTop: 6,
          }}
        >
          {diag}
        </pre>
      </details>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button
          onClick={onRetry}
          style={{
            padding: '10px 18px',
            fontSize: 14,
            background: '#3a6bff',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
          }}
        >
          Try again
        </button>
        <button
          onClick={() => location.reload()}
          style={{
            padding: '10px 18px',
            fontSize: 14,
            background: '#333',
            color: 'white',
            border: 'none',
            borderRadius: 8,
          }}
        >
          Reload page
        </button>
      </div>
    </div>
  )
}

function collectDiagnostics() {
  const lines: string[] = []
  try {
    lines.push(`UA: ${navigator.userAgent}`)
    lines.push(`URL: ${location.href}`)
    lines.push(`Viewport: ${window.innerWidth}x${window.innerHeight}  DPR: ${window.devicePixelRatio}`)
    const canvas = document.createElement('canvas')
    const gl2 =
      (canvas.getContext('webgl2') as WebGL2RenderingContext | null) ?? null
    const gl1 =
      gl2 ??
      (canvas.getContext('webgl') as WebGLRenderingContext | null) ??
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null)
    lines.push(`WebGL2 available: ${Boolean(gl2)}`)
    lines.push(`WebGL1 available: ${Boolean(gl1)}`)
    if (gl1) {
      const info = gl1.getExtension('WEBGL_debug_renderer_info')
      if (info) {
        lines.push(`GPU vendor:   ${gl1.getParameter(info.UNMASKED_VENDOR_WEBGL)}`)
        lines.push(`GPU renderer: ${gl1.getParameter(info.UNMASKED_RENDERER_WEBGL)}`)
      }
      lines.push(`Version:  ${gl1.getParameter(gl1.VERSION)}`)
      lines.push(`Shading:  ${gl1.getParameter(gl1.SHADING_LANGUAGE_VERSION)}`)
      lines.push(`Max tex:  ${gl1.getParameter(gl1.MAX_TEXTURE_SIZE)}`)
    }
  } catch (e) {
    lines.push(`Diag failed: ${(e as Error).message}`)
  }
  return lines.join('\n')
}
