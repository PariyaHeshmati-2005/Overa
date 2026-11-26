/**
 * Page-local design tokens ported from the source pages' `tailwind.config`
 * blocks (M3 family pages: wallet, live-chat, admin-dashboard,
 * 404/500/loading pages).
 *
 * globals.css already carries the color tokens; this component adds the
 * fontSize scale (headline/body/label/display/numeric) and the custom
 * spacing scale (space-*, margin, gutter) used by those pages, without
 * font-weight (weights come from explicit font-bold/font-semibold/…
 * utilities in the converted markup, exactly as the source sets them).
 */
const M3_TOKEN_CSS = `
/* ---------- M3 fontSize scale (source tailwind.config) ---------- */
.text-display-lg,.font-display-lg{font-size:3rem;line-height:3.75rem;letter-spacing:-.02em}
.text-display-lg-mobile,.font-display-lg-mobile{font-size:2.25rem;line-height:2.75rem;letter-spacing:-.02em}
.text-headline-lg,.font-headline-lg{font-size:2rem;line-height:2.5rem;letter-spacing:-.015em}
.text-headline-lg-mobile,.font-headline-lg-mobile{font-size:1.5rem;line-height:2rem;letter-spacing:-.01em}
.text-headline-md,.font-headline-md{font-size:1.25rem;line-height:1.75rem}
.text-headline-sm,.font-headline-sm{font-size:1.125rem;line-height:1.6rem}
.text-body-lg,.font-body-lg{font-size:1.125rem;line-height:1.875rem}
.text-body-md,.font-body-md{font-size:1rem;line-height:1.625rem}
.text-body-sm,.font-body-sm{font-size:.875rem;line-height:1.375rem}
.text-label-lg,.font-label-lg{font-size:1rem;line-height:1.5rem}
.text-label-md,.font-label-md{font-size:.875rem;line-height:1.25rem}
.text-label-sm,.font-label-sm{font-size:.75rem;line-height:1rem}
.text-numeric-stat,.font-numeric-stat{font-size:1.75rem;line-height:2.25rem}

/* ---------- M3 spacing scale (source tailwind.config) ---------- */
.p-space-xs{padding:.25rem}.p-space-sm{padding:.5rem}.p-space-md{padding:1rem}.p-space-lg{padding:1.5rem}.p-space-xl{padding:2rem}.p-space-2xl{padding:3rem}
.px-space-xs{padding-left:.25rem;padding-right:.25rem}.px-space-sm{padding-left:.5rem;padding-right:.5rem}.px-space-md{padding-left:1rem;padding-right:1rem}.px-space-lg{padding-left:1.5rem;padding-right:1.5rem}.px-space-xl{padding-left:2rem;padding-right:2rem}.px-space-2xl{padding-left:3rem;padding-right:3rem}
.py-space-xs{padding-top:.25rem;padding-bottom:.25rem}.py-space-sm{padding-top:.5rem;padding-bottom:.5rem}.py-space-md{padding-top:1rem;padding-bottom:1rem}.py-space-lg{padding-top:1.5rem;padding-bottom:1.5rem}.py-space-xl{padding-top:2rem;padding-bottom:2rem}.py-space-2xl{padding-top:3rem;padding-bottom:3rem}
.pt-space-xs{padding-top:.25rem}.pt-space-sm{padding-top:.5rem}.pt-space-md{padding-top:1rem}.pt-space-lg{padding-top:1.5rem}.pt-space-xl{padding-top:2rem}.pt-space-2xl{padding-top:3rem}
.pb-space-xs{padding-bottom:.25rem}.pb-space-sm{padding-bottom:.5rem}.pb-space-md{padding-bottom:1rem}.pb-space-lg{padding-bottom:1.5rem}.pb-space-xl{padding-bottom:2rem}.pb-space-2xl{padding-bottom:3rem}
.pl-space-xs{padding-left:.25rem}.pl-space-sm{padding-left:.5rem}.pl-space-md{padding-left:1rem}.pl-space-lg{padding-left:1.5rem}.pl-space-xl{padding-left:2rem}.pl-space-2xl{padding-left:3rem}
.pr-space-xs{padding-right:.25rem}.pr-space-sm{padding-right:.5rem}.pr-space-md{padding-right:1rem}.pr-space-lg{padding-right:1.5rem}.pr-space-xl{padding-right:2rem}.pr-space-2xl{padding-right:3rem}
.m-space-xs{margin:.25rem}.m-space-sm{margin:.5rem}.m-space-md{margin:1rem}.m-space-lg{margin:1.5rem}.m-space-xl{margin:2rem}.m-space-2xl{margin:3rem}
.mx-space-xs{margin-left:.25rem;margin-right:.25rem}.mx-space-sm{margin-left:.5rem;margin-right:.5rem}.mx-space-md{margin-left:1rem;margin-right:1rem}.mx-space-lg{margin-left:1.5rem;margin-right:1.5rem}.mx-space-xl{margin-left:2rem;margin-right:2rem}.mx-space-2xl{margin-left:3rem;margin-right:3rem}
.my-space-xs{margin-top:.25rem;margin-bottom:.25rem}.my-space-sm{margin-top:.5rem;margin-bottom:.5rem}.my-space-md{margin-top:1rem;margin-bottom:1rem}.my-space-lg{margin-top:1.5rem;margin-bottom:1.5rem}.my-space-xl{margin-top:2rem;margin-bottom:2rem}.my-space-2xl{margin-top:3rem;margin-bottom:3rem}
.mt-space-xs{margin-top:.25rem}.mt-space-sm{margin-top:.5rem}.mt-space-md{margin-top:1rem}.mt-space-lg{margin-top:1.5rem}.mt-space-xl{margin-top:2rem}.mt-space-2xl{margin-top:3rem}
.mb-space-xs{margin-bottom:.25rem}.mb-space-sm{margin-bottom:.5rem}.mb-space-md{margin-bottom:1rem}.mb-space-lg{margin-bottom:1.5rem}.mb-space-xl{margin-bottom:2rem}.mb-space-2xl{margin-bottom:3rem}
.ml-space-xs{margin-left:.25rem}.ml-space-sm{margin-left:.5rem}.ml-space-md{margin-left:1rem}.ml-space-lg{margin-left:1.5rem}.ml-space-xl{margin-left:2rem}.ml-space-2xl{margin-left:3rem}
.mr-space-xs{margin-right:.25rem}.mr-space-sm{margin-right:.5rem}.mr-space-md{margin-right:1rem}.mr-space-lg{margin-right:1.5rem}.mr-space-xl{margin-right:2rem}.mr-space-2xl{margin-right:3rem}
.gap-space-xs{gap:.25rem}.gap-space-sm{gap:.5rem}.gap-space-md{gap:1rem}.gap-space-lg{gap:1.5rem}.gap-space-xl{gap:2rem}.gap-space-2xl{gap:3rem}
.row-gap-space-md{row-gap:1rem}
.space-y-space-xs>*+*{margin-top:.25rem}.space-y-space-sm>*+*{margin-top:.5rem}.space-y-space-md>*+*{margin-top:1rem}.space-y-space-lg>*+*{margin-top:1.5rem}.space-y-space-xl>*+*{margin-top:2rem}.space-y-space-2xl>*+*{margin-top:3rem}
.px-margin{padding-left:2rem;padding-right:2rem}
.px-margin-mobile{padding-left:1rem;padding-right:1rem}
.gap-gutter{gap:1.5rem}
.gap-gutter-mobile{gap:1rem}
.mx-gutter{margin-left:1.5rem;margin-right:1.5rem}

/* ---------- helpers copied from source <style> blocks ---------- */
.material-symbols-outlined{font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24;display:inline-block;vertical-align:middle;line-height:1}
.material-symbols-outlined.fill{font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24}
.scrollbar-none{scrollbar-width:none}
.scrollbar-none::-webkit-scrollbar{display:none}
.custom-scroll::-webkit-scrollbar{width:5px}
.custom-scroll::-webkit-scrollbar-track{background:transparent}
.custom-scroll::-webkit-scrollbar-thumb{background:#ccc3d8;border-radius:10px}
.custom-scroll::-webkit-scrollbar-thumb:hover{background:#7b7487}
@keyframes ov-shimmer{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}
`;

export default function M3Styles() {
  return <style dangerouslySetInnerHTML={{ __html: M3_TOKEN_CSS }} />;
}
