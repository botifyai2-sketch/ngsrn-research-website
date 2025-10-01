import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  href?: string
  textColor?: string
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12', 
  lg: 'h-16 w-16'
}

const textSizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl'
}

export default function Logo({ 
  className = '', 
  size = 'md', 
  showText = true, 
  href,
  textColor = 'text-ngsrn-primary'
}: LogoProps) {
  const [imageError, setImageError] = useState(false)

  const logoContent = (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* NGSRN Logo - Image with fallback */}
      <div className={`${sizeClasses[size]} flex items-center justify-center flex-shrink-0`}>
        {!imageError ? (
          <Image
            src="/logo.png"
            alt="NGSRN Logo"
            width={size === 'sm' ? 32 : size === 'md' ? 48 : 64}
            height={size === 'sm' ? 32 : size === 'md' ? 48 : 64}
            className="object-contain"
            onError={() => setImageError(true)}
            priority
          />
        ) : (
          // Fallback when image is not available
          <div className={`${sizeClasses[size]} bg-ngsrn-primary text-white rounded-lg font-bold flex items-center justify-center`}>
            <span className={size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'}>
              NG
            </span>
          </div>
        )}
      </div>
      
      {showText && (
        <div>
          <h1 className={`${textSizeClasses[size]} font-bold ${textColor}`}>
            NGSRN
          </h1>
          {size !== 'sm' && (
            <p className="text-sm text-gray-500">Research Network</p>
          )}
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="hover:opacity-80 transition-opacity">
        {logoContent}
      </Link>
    )
  }

  return logoContent
}