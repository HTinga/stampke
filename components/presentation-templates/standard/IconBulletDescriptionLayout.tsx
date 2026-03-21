import { RemoteSvgIcon } from '@/app/hooks/useRemoteSvgIcon';
import React from 'react'
// charts removed
import * as z from "zod";


const ImageSchema = z.object({
  __image_url__: z.string().url().default("https://images.pexels.com/photos/31527637/pexels-photo-31527637.jpeg"),
  __image_prompt__: z.string()).max(180).default("Decorative abstract office scene photo placed at lower right on the band"),
})

const IconSchema = z.object({
  __icon_url__: z.string().default("https://presenton-public.s3.ap-southeast-1.amazonaws.com/static/icons/bold/fediverse-logo-bold.svg"),
  __icon_query__: z.string().min(2)).default("info icon"),
})

const layoutId = "header-bullets-title-description-image-slide"
const layoutName = "Icon Bullet Description"
const layoutDescription = "A slide with a small header label and number, a left card of ...cards with round symbols and titles with descriptions, a large heading with supporting text, and a decorative image on a mid-page band"

const Schema = z.object({
  metaMaxWords: z.number()),


  headerNumber: z.string().min(1).max(3).default("6"),
  rightTitle: z.string()).max(72).default("Disrupting the\nIndustry"),
  rightDescription: z.string()).max(240).default("Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna"),
  // decorative image removed
  cards: z.array(z.object({
    symbolText: z.string().min(1).max(1).default("i"),
    symbolIcon: IconSchema.default({
      __icon_url__: "https://presenton-public.s3.ap-southeast-1.amazonaws.com/static/icons/bold/fediverse-logo-bold.png",
      __icon_query__: "info icon",
    }),
    title: z.string()).max(38).default("Visionary Leadership"),
    description: z.string()).max(100).default("Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor"),
  })).min(1).max(4).default([
    {
      symbolText: "i",
      symbolIcon: { __icon_url__: "https://presenton-public.s3.ap-southeast-1.amazonaws.com/static/icons/bold/fediverse-logo-bold.svg", __icon_query__: "info icon" },
      title: "Visionary Leadership",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor",
    },
    {
      symbolText: "i",
      symbolIcon: { __icon_url__: "https://presenton-public.s3.ap-southeast-1.amazonaws.com/static/icons/bold/video-bold.png", __icon_query__: "info icon" },
      title: "Innovation at the Core",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor",
    },
    {
      symbolText: "i",
      symbolIcon: { __icon_url__: "https://presenton-public.s3.ap-southeast-1.amazonaws.com/static/icons/bold/receipt-x-bold.png", __icon_query__: "info icon" },
      title: "Customer-Centric Disruption",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor",
    },
    {
      symbolText: "i",
      symbolIcon: { __icon_url__: "https://presenton-public.s3.ap-southeast-1.amazonaws.com/static/icons/bold/users-four-bold.png", __icon_query__: "info icon" },
      title: "Customer-Centric Disruption",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor",
    }
  ]),
  // chart and diagram removed
})

type SlideData = z.infer<typeof Schema>

interface SlideLayoutProps {
  data?: Partial<SlideData>
}

const dynamicSlideLayout: React.FC<SlideLayoutProps> = ({ data: slideData }) => {
  const cards = slideData?.cards || []
  // charts removed

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div className=" w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden" style={{ fontFamily: "var(--heading-font-family,Playfair Display)", backgroundColor: 'var(--background-color, #FFFFFF)' }}>

        <div className="relative z-10 flex items-center justify-between px-[40px] pt-[24px]">
          <div className="flex items-center gap-[24px]">
            <div className="flex items-center gap-1">

              {(slideData as any)?._logo_url__ && <img src={(slideData as any)?._logo_url__} alt="logo" className="w-6 h-6" />}
              {(slideData as any)?.__companyName__ && <span className="text-[18px]  font-semibold" style={{ color: 'var(--background-text, #111827)' }}>{(slideData as any)?.__companyName__ || "Pitchdeck"}</span>}
            </div>
            <svg className="hidden md:block" width="220" height="2" viewBox="0 0 220 2" fill="none" aria-hidden="true">
              <rect width="220" height="2" rx="1" style={{ fill: 'var(--background-text, #111827)' }}></rect>
            </svg>
          </div>
          {/* page number removed */}
        </div>

        <div className="relative z-10 grid grid-cols-[600px_1fr] gap-[64px] px-[80px] pt-[12px]">
          <div className="w-[600px]">
            <div className="rounded-[10px] shadow-[0_20px_60px_rgba(0,0,0,0.08)] px-[36px] py-[28px]" style={{ backgroundColor: 'var(--card-color, #FFFFFF)' }}>
              <ul className="flex flex-col gap-[28px]">
                {cards.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-[24px]">
                    <div className="w-[88px] h-[88px] rounded-full flex items-center justify-center overflow-hidden select-none" style={{ backgroundColor: 'var(--primary-color, #FFFFFF)' }}>
                      {item.symbolIcon?.__icon_url__ ? (
                        <RemoteSvgIcon
                          url={item.symbolIcon.__icon_url__}
                          strokeColor={"currentColor"}
                          className="w-14 h-14"
                          color="var(--primary-text, #111827)"
                          title={item.symbolIcon.__icon_query__}
                        />
                      ) : (
                        <span className="text-[34px] font-semibold" style={{ color: 'var(--primary-color, #1B8C2D)' }}>{item.symbolText}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className=" text-[24px] font-semibold leading-[1.15]" style={{ color: 'var(--background-text, #111827)' }}>{item.title}</h3>
                      <p className=" text-[16px] leading-[1.55] mt-[8px]" style={{ color: 'var(--background-text, #6B7280)' }}>{item.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-[28px]">
            <h1 className="font-['Playfair Display'] text-[64px] leading-[1.05] tracking-[-0.01em] max-w-[600px] font-semibold" style={{ color: 'var(--background-text, #111827)' }} dangerouslySetInnerHTML={{ __html: (slideData?.rightTitle || "Disrupting the\nIndustry").replace(/\n/g, "<br/>") }}></h1>
            <div className="mt-[24px] inline-block rounded-md px-6 py-4" style={{ backgroundColor: 'var(--card-color, #F3F4F6)' }}>
              <p className="font-['Playfair Display'] text-[16px] leading-[1.6] max-w-[620px]" style={{ color: 'var(--background-text, #6B7280)' }}>
                {slideData?.rightDescription || "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna"}
              </p>
            </div>


          </div>
        </div>


      </div>
    </>
  )
}

export { Schema, layoutId, layoutName, layoutDescription }
export default dynamicSlideLayout