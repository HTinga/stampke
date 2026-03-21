import React from 'react'
// charts removed
import * as z from "zod";

const ImageSchema = z.object({
  __image_url__: z.string().url().default("https://images.pexels.com/photos/31527637/pexels-photo-31527637.jpeg"),
  __image_prompt__: z.string()).max(150).default("Small decorative photo partially behind the card showing a business theme"),
})

const IconSchema = z.object({
  __icon_url__: z.string().default(""),
  __icon_query__: z.string().min(3)).default(""),
})

const layoutId = "split-left-strip-header-title-subtitle-cards-slide"
const layoutName = "Heading Bullet Image Description"
const layoutDescription = "A slide with a left strip, top label with rule, right header, right description, floating small image, and a centered card with ...cards."

const Schema = z.object({
  metaMaxWords: z.number()),
  pageNumber: z.string().min(1).max(3).default("7"),

  heading: z.string()).max(38).default("A Blueprint for\nSuccess"),
  subheading: z.string()).max(200).default("Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna"),
  smallImage: ImageSchema.default({
    __image_url__: "https://images.pexels.com/photos/327533/pexels-photo-327533.jpeg",
    __image_prompt__: "A small landscape image suitable for a business slide"
  }),
  cards: z.array(z.object({
    title: z.string().min(8)).default("Strategy 01"),
    body: z.string()).max(160).default("Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor"),
  })).min(1).max(4).default([
    { title: "Strategy 01", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor" },
    { title: "Strategy 02", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor" },
    { title: "Strategy 03", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor" },
    { title: "Strategy 04", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor" },
  ]),

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
        {/* page number removed */}

        <div className="grid grid-cols-2 h-full">
          <div className="relative bg-[#efefef]">
            {slideData?.smallImage?.__image_url__ ? (
              <>
                <img
                  src={slideData.smallImage.__image_url__}
                  alt={slideData.smallImage.__image_prompt__ || "image"}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* overlay removed */}
              </>
            ) : null}
            <div className="pt-6 pl-10 pr-6 relative z-[1]">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-1">

                  {(slideData as any)?._logo_url__ && <img src={(slideData as any)?._logo_url__} alt="logo" className="w-6 h-6" />}
                  {(slideData as any)?.__companyName__ && <span className="text-[18px]  font-semibold" style={{ color: 'var(--background-text, #111827)' }}>{(slideData as any)?.__companyName__ || "Pitchdeck"}</span>}
                </div>
                <div className="h-[2px] w-[220px] rounded-full" style={{ backgroundColor: 'var(--background-text, #111827)' }}></div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-[88px] bg-gradient-to-t from-black/20 to-transparent z-[1]"></div>
          </div>

          <div className="relative px-12 pt-16">
            <h1 className=" leading-[72px] text-[64px] tracking-tight whitespace-pre-line font-semibold" style={{ color: 'var(--background-text, #111827)' }}>
              {slideData?.heading || "A Blueprint for\nSuccess"}
            </h1>

          </div>
        </div>
        <div className="absolute left-10 right-10 top-[320px] z-10">
          <div className="w-fit max-w-full rounded-md shadow-[0_20px_60px_rgba(0,0,0,0.12)] ml-auto" style={{ backgroundColor: 'var(--card-color, #F3F4F6)' }}>
            <div className="px-8 py-10">
              <div className="grid grid-flow-col auto-cols-max gap-6">
                {cards.map((card, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div className="w-[240px] h-[64px] rounded-sm text-white flex items-center justify-center  text-[22px]" style={{ backgroundColor: 'var(--primary-color, #1B8C2D)', color: 'var(--primary-text, #FFFFFF)' }}>
                      {card.title}
                    </div>
                    <p className="mt-6 text-center text-[16px] leading-[28px]  max-w-[240px]" style={{ color: 'var(--background-text, #6B7280)' }}>
                      {card.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export { Schema, layoutId, layoutName, layoutDescription }
export default dynamicSlideLayout