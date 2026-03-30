import { useEffect, useRef, useState } from "react";
import addImg from "@/src/app/images/svg/add.svg";

import partnerData from "@/src/app/data/partnerData.json";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { CircularProgress } from "@mui/material";
import { useTheme } from "@/src/app/components/providers/ThemeProvider";



function moveFirstItemToMiddle(partnerData: any) {
    if (partnerData.length <= 1) return partnerData;

    const firstItem = partnerData[0];
    const rest = partnerData.slice(1);
    const middleIndex = Math.floor((rest.length + 1) / 2);

    return [...rest.slice(0, middleIndex), firstItem, ...rest.slice(middleIndex)];

    // const firstItem = partnerData[0];
    // const secondItem = partnerData[1]
    // const rest = partnerData.slice(2);
    // const middleIndex = Math.floor((rest.length + 1) / 2);

    // return [secondItem, firstItem, ...rest];



}

export default function QrBasePartnerList({ allMarketCap, partners, id }: any) {
    const router = useRouter();
    const params = useParams();
    const address = params?.address ?? "";
    const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Use passed partners or fallback to imported data
    const sourceData = partners || partnerData;

    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeCard, setActiveCard] = useState(sourceData[0]?.id || "");
    const [reorderedData, setReorderedData] = useState(
        moveFirstItemToMiddle(sourceData)
    );

    useEffect(() => {
        setReorderedData(moveFirstItemToMiddle(sourceData));
    }, [sourceData]);

    useEffect(() => {
        if (address) setActiveCard(address as string);
    }, []);




    useEffect(() => {
        if (activeCard && cardRefs.current[activeCard]) {
            cardRefs.current[activeCard]?.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "center",
            });
        }
    }, [activeCard]);

    const handleCardClick = (id: string, isTBA: boolean) => {
        if (isTBA) return;
        setActiveCard(id);
        router.push(`/scanMode/${id}`, { scroll: false });
    };

    const cardData = reorderedData.map((card: any) => ({
        ...card,
        logo: card.scan_mode_partner_logo || card.logo, // Prioritize explicit scan mode logo
    }));

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
            id={id}
            className="fixed left-0 w-full border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 z-50 top-[100px] md:top-[91px] transition-colors duration-200"

        >
            <div className="container mx-auto px-4 py-2 lg:px-6">
                <div
                    ref={scrollRef}
                    className="flex overflow-x-auto space-x-4 scrollbar-hide md:justify-center"
                    style={{
                        whiteSpace: "nowrap",
                        scrollBehavior: "smooth",
                        WebkitOverflowScrolling: "touch",
                        cursor: "grab",
                    }}
                >
                    {cardData.map((card: any, index: any) => {
                        const isActive = activeCard === card.id;
                        const isTBA = card.title === "TBA";
                        const isBaseEveryone = card.title === "Base is for everyone";

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
                                        : isDark ? "#374151" : "#F3F4F6",
                                    boxSizing: "border-box",
                                    cursor: isTBA ? "not-allowed" : "pointer",
                                    opacity: isTBA ? 0.2 : 1,
                                    flexShrink: 0,
                                }}
                                onClick={() => handleCardClick(card.id, isTBA)}
                            >
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        borderRadius: "28px",
                                        background: isActive ? (isDark ? "#1e3a5f" : "#E8F0FF") : (isDark ? "#1f2937" : "#F3F4F6"),
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
                                            style={{ borderRadius: "136px" }}
                                        />
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span
                                                style={{
                                                    fontFamily: "'Noto Sans Mono', monospace",
                                                    fontSize: "12px",
                                                    fontWeight: 600,
                                                    lineHeight: "10.23px",
                                                    verticalAlign: "middle",
                                                    color: isDark ? "#fff" : "#000",
                                                }}
                                            >
                                                {isBaseEveryone ? "Base" : card.title}
                                            </span>
                                            {!isTBA ? (
                                                <span style={{ color: "#00C566", fontSize: "11px" }}>
                                                    {card.piecesUnlocked ?? 0}/{card.totalPieces ?? 9}
                                                </span>
                                            ) : (
                                                <CircularProgress size={12} />
                                            )}
                                        </div>
                                        <span style={{
                                            fontFamily: "'Noto Sans Mono', monospace",
                                            fontSize: "11px",
                                            fontWeight: 500,
                                            lineHeight: "22.75px",
                                            letterSpacing: "-0.02em",
                                            verticalAlign: "middle",
                                        }}>
                                            <span style={{ color: "#27AE75" }}>{`$${card.prizes}`}</span>{" "}
                                            <span style={{ color: "#5B616E" }}>in rewards</span>
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
                        onClick={() => window.open("https://listing.qrbase.xyz/submit-application", "_blank")}
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
                                background: '#fff',
                                borderRadius: "50%",
                                width: '32px',
                                height: '32px',
                                border: '1px dotted #0052FF',
                                placeItems: 'center',
                                alignContent: 'center'
                            }}>
                                <Image
                                    src={addImg}
                                    alt="Logo"
                                    width={20}
                                    height={20}
                                />
                            </div>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontSize: "12px", fontWeight: 600, color: "#0052FF" }}>
                                    TOKEN
                                </span>
                                <span style={{ fontSize: "11px" }}>
                                    <span style={{ color: "#0052FF" }}>Apply For Listing</span>{" "}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
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

