import { useEffect, useRef, useState } from "react";
import addImg from "@/src/app/images/svg/add.svg";


import partnerData from "@/src/app/data/partnerData.json";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";

function moveFirstItemToMiddle(partnerData: any) {
    if (partnerData.length <= 1) return partnerData;

    const firstItem = partnerData[0];
    const rest = partnerData.slice(1);
    const middleIndex = Math.floor((rest.length + 1) / 2);

    return [...rest.slice(0, middleIndex), firstItem, ...rest.slice(middleIndex)];
}

export default function QrBasePartnerList() {
    const router = useRouter();
    const params = useParams();
    const address = params?.address ?? "";
    const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeCard, setActiveCard] = useState(partnerData[0]?.id || "");
    const [reorderedData, setReorderedData] = useState(
        moveFirstItemToMiddle(partnerData)
    );

    useEffect(() => {
        if (address) setActiveCard(address as string);
    }, []);

    useEffect(() => {
        // Ensure that activeCard exists and the reference to it is valid
        if (activeCard && cardRefs.current[activeCard]) {
            cardRefs.current[activeCard]?.scrollIntoView({
                behavior: "smooth",
                block: "center",  
                inline: "center", 
            });
        }
    }, [activeCard]); 

    const handleCardClick = (id: string) => {
        setActiveCard(id);
        router.push(`/base/${id}`, { scroll: false });
    };

    const cardData = reorderedData.map((card: any) => ({
        ...card,
        logo: card.logo,
    }));

    // Horizontal scroll with mouse wheel
    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            container.scrollLeft += e.deltaY;
        };

        container.addEventListener("wheel", handleWheel, { passive: false });

        return () => {
            container.removeEventListener("wheel", handleWheel);
        };
    }, []);

    // Click and drag to scroll
    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;

        let isDown = false;
        let startX = 0;
        let scrollLeft = 0;

        const onMouseDown = (e: MouseEvent) => {
            isDown = true;
            container.classList.add("dragging");
            startX = e.pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
        };

        const onMouseMove = (e: MouseEvent) => {
            if (!isDown) return;
            const x = e.pageX - container.offsetLeft;
            const walk = (x - startX) * 2;
            container.scrollLeft = scrollLeft - walk;
        };

        const onMouseUp = () => {
            isDown = false;
            container.classList.remove("dragging");
        };

        container.addEventListener("mousedown", onMouseDown);
        container.addEventListener("mousemove", onMouseMove);
        container.addEventListener("mouseup", onMouseUp);
        container.addEventListener("mouseleave", onMouseUp);

        return () => {
            container.removeEventListener("mousedown", onMouseDown);
            container.removeEventListener("mousemove", onMouseMove);
            container.removeEventListener("mouseup", onMouseUp);
            container.removeEventListener("mouseleave", onMouseUp);
        };
    }, []);

    return (
        <header
            className="fixed left-0 w-full border-b border-gray-200 bg-white z-50"
            style={{ top: "97px" }}
        >
            <div className="container mx-auto px-4 py-2 lg:px-6">
                <div
                    ref={scrollRef}
                    className="flex overflow-x-auto space-x-4 scrollbar-hide"
                    style={{
                        whiteSpace: "nowrap",
                        scrollBehavior: "smooth",
                        WebkitOverflowScrolling: "touch",
                        cursor: "grab",
                    }}
                >
                    {cardData.map((card: any, index: any) => {
                        const isActive = activeCard === card.id;
                        return (
                            <div
                                key={index}
                                ref={(el) => {
                                    if (el) cardRefs.current[card.id] = el;
                                }}
                                style={{
                                    width: "180px",
                                    height: "48px",
                                    minWidth: "180px",
                                    borderRadius: "30px",
                                    padding: "2px",
                                    background: isActive
                                        ? "linear-gradient(90deg, #0052FE, #42C5F7)"
                                        : "#F3F4F6",
                                    boxSizing: "border-box",
                                    cursor: "pointer",
                                    flexShrink: 0,
                                }}
                                onClick={() => handleCardClick(card.id)}
                            >
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        borderRadius: "28px",
                                        background: isActive ? "#E8F0FF" : "#F3F4F6",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        padding: "0 12px",
                                        boxSizing: "border-box",
                                    }}
                                >
                                    <div>
                                        <Image
                                            src={card.logo}
                                            alt="Logo"
                                            width={32}
                                            height={32}
                                            style={{ borderRadius: "50%" }}
                                        />
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                        <span
                                            style={{
                                                fontSize: "12px",
                                                fontWeight: 600,
                                                color: "#000",
                                            }}
                                        >
                                            {card.title}
                                        </span>
                                        <span style={{ fontSize: "11px" }}>
                                            <span style={{ color: "#00C566" }}>${card.reward}</span>{" "}
                                            in rewards
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Extra Apply For Listing Card */}
                    <div
                        style={{
                            width: "180px",
                            height: "48px",
                            minWidth: "180px",
                            borderRadius: "30px",
                            padding: "2px",
                            background: "#D0E1FF",
                            boxSizing: "border-box",
                            cursor: "pointer",
                            flexShrink: 0,
                        }}
                        onClick={() => alert("Apply For Listing")}
                    >

                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                borderRadius: "28px",
                                background: "#D0E1FF",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "0 12px",
                                boxSizing: "border-box",

                            }}
                        >
                            <div style={{
                                background: '#fff', borderRadius: "50%", width: '32px', height: '32px', border: '1px dotted #0052FF', placeItems: 'center', alignContent: 'center'
                            }}>
                                <Image
                                    src={addImg}
                                    alt="Logo"
                                    width={20}
                                    height={20}

                                />
                            </div>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <span
                                    style={{ fontSize: "12px", fontWeight: 600, color: "#0052FF" }}
                                >
                                    TOKEN
                                </span>
                                <span style={{ fontSize: "11px" }}>
                                    <span style={{ color: "#0052FF" }}>Apply For Listing</span>{" "}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div> <style jsx global>{`
        .dragging {
  cursor: grabbing !important;
}

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
        </header>
    );
}
