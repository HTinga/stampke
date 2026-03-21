import React from 'react'
// charts trimmed to donut only (inline SVG)
import * as z from "zod";


const ImageSchema = z.object({
    __image_url__: z.string().url().default("https://images.unsplash.com/photo-1522199755839-a2bacb67c546?q=80&w=1200&auto=format&fit=crop"),
    __image_prompt__: z.string()).max(150).default("Abstract light background for slide header area"),
})

const IconSchema = z.object({
    __icon_url__: z.string().url().default("https://cdn.jsdelivr.net/gh/tabler/tabler-icons/icons/placeholder.svg"),
    __icon_query__: z.string().min(3)).default("progress ring placeholder"),
})

const layoutId = "visual-metrics"
const layoutName = "Visual Metrics"
const layoutDescription = "A slide with a header bar, numeric marker, title, description, and grid of cards with headings, circular metrics, and texts"

const CardSchema = z.object({
    title: z.string().min(6)).default("Research"),
    value: z.number().min(0)).default(67),
    unit: z.string().min(0).max(2).default("K"),
    description: z.string().min(1)).default("Lorem ipsum dolor sit amet, consectetur"),
}).default({
    title: "Research",
    value: 67,
    unit: "K",
    description: "Lorem ipsum dolor sit amet, consectetur",
})

const Schema = z.object({
    topBar: z.object({

        marker: z.string().min(1).max(3).default("2"),
    }).default({

        marker: "2",
    }),
    title: z.string()).max(68).default("Our Vision And Strategy For Excellence"),
    description: z.string()).max(200).default("Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation"),
    cards: z.array(CardSchema).min(1).max(4).default([
        {
            title: "Research",
            value: 6700,
            unit: "K",
            description: "Lorem ipsum dolor sit amet, consectetur",

        },
        {
            title: "Development",
            value: 80,
            unit: "K",
            description: "Lorem ipsum dolor sit amet, consectetur",

        },
        {
            title: "Research",
            value: 67,
            unit: "%",
            description: "Lorem ipsum dolor sit amet, consectetur",

        },
        { title: "Development", value: 80, unit: "K", description: "Lorem ipsum dolor sit amet, consectetur" },
    ]),
    chartPalette: z.array(z.string().min(4))).min(2).max(6).default(["var(--primary-color, #1B8C2D)", "var(--background-text, #E5E7EB)", "#f59e0b", "#3b82f6"]),
}).default({
    topBar: { marker: "2" },
    title: "Our Vision And Strategy For Excellence",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation",
    cards: [
        { title: "Research", value: 67, unit: "K", description: "Lorem ipsum dolor sit amet, consectetur" },
        { title: "Ops", value: 42, unit: "M", description: "Lorem ipsum dolor sit amet, consectetur" },
        { title: "Efficiency", value: 67, unit: "%", description: "Lorem ipsum dolor sit amet, consectetur" },
        { title: "Development", value: 80, unit: "K", description: "Lorem ipsum dolor sit amet, consectetur" },
    ],
    chartPalette: ["var(--primary-color, #1B8C2D)", "var(--background-text, #E5E7EB)", "#f59e0b", "#3b82f6"],
})

type SlideData = z.infer<typeof Schema>

interface SlideLayoutProps {
    data?: Partial<SlideData>
}


const dynamicSlideLayout: React.FC<SlideLayoutProps> = ({ data: slideData }) => {
    const cards = slideData?.cards || []
    return (
        <>
            <link
                href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap"
                rel="stylesheet"
            />
            <div className=" w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden" style={{ fontFamily: "var(--heading-font-family,Playfair Display)", backgroundColor: 'var(--background-color, #FFFFFF)' }}>
                <div className="px-12 pt-6 pb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                            <div className="flex items-center gap-1">

                                {(slideData as any)?._logo_url__ && <img src={(slideData as any)?._logo_url__} alt="logo" className="w-6 h-6" />}
                                {(slideData as any)?.__companyName__ && <span className="text-[18px]  font-bold" style={{ color: 'var(--background-text, #111827)' }}>{(slideData as any)?.__companyName__ || "Pitchdeck"}</span>}
                            </div>
                            <div className="h-[2px] w-[220px]" style={{ backgroundColor: 'var(--background-text, #111827)' }}></div>
                        </div>
                    </div>
                </div>

                <div className="px-12">
                    <h1 className="text-[64px] leading-[1.05] tracking-tight  font-bold mt-2" style={{ color: 'var(--background-text, #111827)' }}>
                        {slideData?.title}
                    </h1>
                    <p className="mt-5 text-[16px] leading-[1.6] max-w-[1020px] " style={{ color: 'var(--background-text, #6B7280)' }}>
                        {slideData?.description}
                    </p>
                </div>

                <div className="px-10 mt-10">
                    <div className="grid grid-cols-4 gap-8">
                        {cards.map((card, idx) => {
                            const radius = 80
                            const circumference = 2 * Math.PI * radius
                            const dasharray = circumference
                            return (
                                <div key={idx} className="rounded-xl border shadow-[0_24px_60px_rgba(0,0,0,0.08)]" style={{ backgroundColor: 'var(--card-color, #FFFFFF)', borderColor: 'var(--stroke, #E5E7EB)' }}>
                                    <div className="px-8 pt-8 pb-7 flex flex-col items-center text-center">
                                        <h3 className="text-[24px] leading-tight font-bold" style={{ color: 'var(--background-text, #111827)' }}>{card.title}</h3>
                                        <div className="mt-6 relative w-[180px] h-[180px]">
                                            <svg viewBox="0 0 200 200" className="w-full h-full">
                                                <circle cx="100" cy="100" r="80" fill="none" stroke="var(--background-text, #E5E7EB)" strokeWidth="16"></circle>
                                                <circle
                                                    cx="100"
                                                    cy="100"
                                                    r="80"
                                                    fill="none"
                                                    stroke={'var(--primary-color, #1B8C2D)'}
                                                    strokeWidth="16"
                                                    strokeLinecap="round"
                                                    strokeDasharray={dasharray}
                                                    strokeDashoffset={0}
                                                    transform="rotate(-90 100 100)"
                                                ></circle>
                                                <circle cx="100" cy="100" r="62" fill="none" stroke="var(--stroke, #E5E7EB)" strokeWidth="10"></circle>
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-[32px] font-extrabold " style={{ color: 'var(--background-text, #111827)' }}>{card.value}{card.unit}</span>
                                            </div>
                                        </div>
                                        <p className="mt-6 text-[16px] leading-[1.6] " style={{ color: 'var(--background-text, #6B7280)' }}>
                                            {card.description}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

            </div>
        </>
    )
}

export { Schema, layoutId, layoutName, layoutDescription }
export default dynamicSlideLayout