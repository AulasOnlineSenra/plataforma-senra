import { cn } from '@/lib/utils';

export function SenraLogo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-auto h-full', className)}
      {...props}
    >
      <circle cx="100" cy="100" r="98" fill="none" stroke="#FBBF24" strokeWidth="2" />
      <g fill="white" >
        <path d="M70,140 h-20 v-15 h20 z" />
        <path d="M70,125 h15 v-20 h-15 z" />
        <path d="M85,105 h20 v-15 h-20 z" />
        <path d="M105,90 h15 v-20 h-15 z" />
        <path d="M120,70 h20 v-15 h-20 z" />
      </g>
      <g fill="#FBBF24">
        <path d="M85,125 h-15 v15 h15 z" />
        <path d="M85,105 v20 h-20 v-20 h-15 v-15 h15 v-20 h20 v20 h15 v15 z" transform="translate(0, 0)" />
      </g>
      <text
        x="45"
        y="160"
        fontSize="12"
        fill="white"
        fontFamily="Alegreya, serif"
      >
        Aulas Particulares Online
      </text>
      <text
        x="170"
        y="130"
        fontSize="30"
        fill="#FBBF24"
        fontFamily="Belleza, sans-serif"
        transform="rotate(-90, 170, 130)"
        textAnchor="middle"
      >
        SENRA
      </text>
    </svg>
  );
}
