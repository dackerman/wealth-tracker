import logoPath from "@/assets/logo.png";

interface LogoHorizontalProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "dark" | "light" | "color";
}

export function LogoHorizontal({ 
  className = "",
  size = "md",
  variant = "dark" 
}: LogoHorizontalProps) {
  // Size mappings
  const sizes = {
    sm: {
      container: "h-8",
      logo: "w-8 h-8",
      text: "text-lg"
    },
    md: {
      container: "h-10",
      logo: "w-10 h-10",
      text: "text-xl"
    },
    lg: {
      container: "h-12",
      logo: "w-12 h-12",
      text: "text-2xl"
    }
  };

  // Color variants
  const variants = {
    dark: "text-[var(--wealth-dark-slate)]",
    light: "text-white",
    color: "wealth-gradient-text"
  };

  return (
    <div className={`flex items-center ${sizes[size].container} ${className}`}>
      <img 
        src={logoPath} 
        alt="WealthVision Logo" 
        className={`${sizes[size].logo} mr-2`} 
      />
      <h1 className={`font-bold ${sizes[size].text} ${variants[variant]}`}>
        WealthVision
      </h1>
    </div>
  );
}