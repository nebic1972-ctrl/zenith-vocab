import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url)

    const title = searchParams.get('title') || 'Koleksiyon'
    const icon = searchParams.get('icon') || '📚'
    const words = searchParams.get('words') || '0'
    const color = searchParams.get('color') || '#3b82f6'

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            backgroundImage: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
            position: 'relative'
          }}
        >
          {/* Background decoration */}
          <div
            style={{
              position: 'absolute',
              top: -100,
              right: -100,
              width: 400,
              height: 400,
              borderRadius: '50%',
              background: `${color}20`,
              display: 'flex'
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -150,
              left: -150,
              width: 500,
              height: 500,
              borderRadius: '50%',
              background: `${color}15`,
              display: 'flex'
            }}
          />

          {/* Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px',
              zIndex: 1
            }}
          >
            {/* Icon */}
            <div
              style={{
                fontSize: 120,
                marginBottom: 40,
                display: 'flex'
              }}
            >
              {icon}
            </div>

            {/* Title */}
            <div
              style={{
                fontSize: 64,
                fontWeight: 'bold',
                color: '#1f2937',
                textAlign: 'center',
                marginBottom: 30,
                maxWidth: '90%',
                display: 'flex',
                lineHeight: 1.2
              }}
            >
              {title}
            </div>

            {/* Stats */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 40,
                marginBottom: 40
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '20px 40px',
                  backgroundColor: `${color}20`,
                  borderRadius: 16
                }}
              >
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 'bold',
                    color: color,
                    display: 'flex'
                  }}
                >
                  {words}
                </div>
                <div
                  style={{
                    fontSize: 24,
                    color: '#6b7280',
                    display: 'flex'
                  }}
                >
                  Kelime
                </div>
              </div>
            </div>

            {/* Brand */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 15,
                marginTop: 40
              }}
            >
              <div
                style={{
                  fontSize: 40,
                  display: 'flex'
                }}
              >
                📚
              </div>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 'bold',
                  background: `linear-gradient(135deg, ${color} 0%, #8b5cf6 100%)`,
                  backgroundClip: 'text',
                  color: 'transparent',
                  display: 'flex'
                }}
              >
                Zenith Vocab
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630
      }
    ) as Response
  } catch (error) {
    console.error('Error generating OG image:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}
