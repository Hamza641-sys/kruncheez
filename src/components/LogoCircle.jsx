import { useLogo } from '../context/LogoContext';

// Reusable logo circle — shows image if logoUrl set, else "K" text
const LogoCircle = ({ size = 'md', className = '' }) => {
  const { logoUrl } = useLogo();

  const sizes = {
    sm:  'w-9 h-9 text-sm',
    md:  'w-11 h-11 text-base',
    lg:  'w-12 h-12 text-lg',
  };

  const sizeClass = sizes[size] || sizes.md;

  return (
    <div className={`${sizeClass} rounded-full border-2 border-krunch-red flex items-center justify-center bg-krunch-black overflow-hidden flex-shrink-0 ${className}`}>
      {logoUrl ? (
        <img
          src={logoUrl}
          alt="KrunchEez Logo"
          className="w-full h-full object-contain"
          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
        />
      ) : (
        <span className="text-krunch-red font-heading font-black">K</span>
      )}
      {/* Fallback — hidden by default */}
      <span className="text-krunch-red font-heading font-black hidden items-center justify-center w-full h-full">K</span>
    </div>
  );
};

export default LogoCircle;
