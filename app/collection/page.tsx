"use client";
import { useState } from "react";

export default function ProtoCoreCollection() {
  const [activeFilter, setActiveFilter] = useState("all");

  const products = [
    {
      id: 1,
      name: "GRAVITY PARKA",
      model: "MODEL: XR-70_V1",
      price: "$840",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCex3zLQuAGXutv2Z9MVCRc5vuwGvV0a74So0cbw_dZfZHvU3pH_YjowL_xBrGY7H2yzFibN3CRVvO4S99oCu32BSLKfo2DW_dulSczrEBGsz6V-XmCiHmVjNCqqZIetD8w-JcrqSNKTggts-ybUVGS7ZEpzcAH1HmiBx0YpzYnxUsi6fBseb2Tv4uSWOYzcmvcbmndbWbnBPBO0q-Oz4yXqC9tw5a4xWxyTIFHx0xTTZrXy1OZ_LblQ8kV27UbGmG-u0pcLGs3ag",
      altImage:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDxhRmkbnPzQBKA1elKycVoq9V4CDyRWOFBkcYm_bagVaSqzsKlArIVjPmOEcRh1T__HQmEzu69SYJdErGA0XipaoibC42L6MYHSw6BsBaHfMO-903PAHlOBugoc4fk5THwSk5LOZk2cd29-dawu-Aqv6BB2lhxbMDuFBL6aLMETXPA7XFVXbZXuXJU4bO4GpfVKc2F4gAjQS7gxGb_p4NHfMnNu1M8Wnh9epLEmnZl4DReeahnF5mZg73A3u_JCk7fyrkRK_cyiw",
      badge: "New Arrival",
      altIsImage: true,
      icon: "radar",
      coord: "COORD: 40.7128° N",
      filter: "outer",
    },
    {
      id: 2,
      name: "OS-IRIS HELMET",
      model: "MODEL: HELM_CORE",
      price: "$1,200",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDw8otXMt6K2cgvkuBcYoYDjo4bXLLUX8V_Hxq5T34_geVcLRyPQsy0OLER2TtoWa0v_MKoQbQlddtqNXCV4NA01mbQRzcsAmy-z8JhVnc5WZ0mtxlRzxYvAhLj0_xq-OO3Ky-9qFHzNdZZNv3nNVnPc6x4i2A2JnjQakilflEGWkQtHkqr_VMNw-8sYOZl6xBnSrj2qBHVVYrW2D1k0NUxabxy3k7BHu5kWHCeazR5Gqpsu0WOXNuXjJhIaVDjBbokgVGbctAT_w",
      altImage: null,
      badge: null,
      altIsImage: false,
      icon: "memory",
      coord: "KERN: 2.0.44",
      filter: "tops",
    },
    {
      id: 3,
      name: "GRID CHRONO",
      model: "MODEL: TIME_SYNC",
      price: "$310",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCG-3-shoxluGO1noj8N84BfqKLiPDM-gM_KiIaIFzFZVJVgEc-Pj91F1llwLotwggkPo2oXgLH_t0o29C6CVpjYIw7nxP3TtsRmU4VO1631NslLbFfUG27zj7KDjfhaLdE3ba1GwRKA_Q0qDYBCrXKsjPAWWw35NaEbLZFOL_TJEfUg_Vrss1WTbvw-f1Ofc8Ba_UUbuvelndBmvCqTKR378CWKxrhM5FrNxnE7jqlfKZJ3szOxTzllmCth-xxjoJ8XgqwhNcDVw",
      altImage:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuC-UTmZXjJQaEEW2oBOAoFbEtPo2KxxXIN-zQAqeTwrWtRDafkg7KxaIIMfY-LOb_3WZF1KmP9j66_abf6TbVRRjtOf0IwJjBibrVewTTzAS1cMDJ2h2oHnOsMF1rGhx1Ctz1ssVnsfvBy7HPEt0UN0nWg7aDbRyaJlo517hAASz_eDW92x8Zqo5RJEhCoVFZQLOp5nbeI_8iwaUgT9DVYgcSte00unO2KP75gtgs1-r9HMI4P0tXP9OCoPoWdRSV6NU-4_PMVuog",
      badge: "Limited Intel",
      altIsImage: true,
      icon: "explore",
      coord: "SIGNAL: WEAK",
      filter: "bottoms",
    },
  ];

  const filteredProducts =
    activeFilter === "all"
      ? products
      : products.filter((p) => p.filter === activeFilter);

  return (
    <div className="min-h-screen bg-[#16111b] text-[#eadfed]">
      {/* Void Layers */}
      <div className="fixed inset-0 z-[-1] overflow-hidden">
        <div className="absolute inset-0 scanlines opacity-30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(221,183,255,0.05)_0%,transparent_70%)]" />
      </div>

      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 bg-[#16111b]/80 backdrop-blur-md border-b border-[#4d4354]">
        <div className="flex justify-between items-center px-4 md:px-16 h-20 w-full max-w-[1440px] mx-auto">
          <img src="/assets/streetplayr-logo.png" alt="StreetplayR" className="h-12 w-auto object-contain" />
          <nav className="hidden md:flex gap-8">
            <a href="#" className="text-[12px] tracking-[0.1em] uppercase text-[#ddb7ff] border-b-2 border-[#ddb7ff] pb-1" style={{ fontFamily: "'Space Mono', monospace" }}>Drops</a>
            <a href="#" className="text-[12px] tracking-[0.1em] uppercase text-[#cfc2d6] hover:text-[#ddb7ff] transition-all glow-sm" style={{ fontFamily: "'Space Mono', monospace" }}>Archive</a>
            <a href="#" className="text-[12px] tracking-[0.1em] uppercase text-[#cfc2d6] hover:text-[#ddb7ff] transition-all glow-sm" style={{ fontFamily: "'Space Mono', monospace" }}>Lab</a>
            <a href="#" className="text-[12px] tracking-[0.1em] uppercase text-[#cfc2d6] hover:text-[#ddb7ff] transition-all glow-sm" style={{ fontFamily: "'Space Mono', monospace" }}>Intel</a>
          </nav>
          <div className="flex items-center gap-6">
            <button className="material-symbols-outlined text-[#ddb7ff] hover:glow-sm transition-all text-2xl">shopping_cart</button>
            <button className="material-symbols-outlined text-[#ddb7ff] hover:glow-sm transition-all text-2xl">account_balance_wallet</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative w-full h-[400px] overflow-hidden border-b border-[#4d4354] mt-20">
        <img
          alt="Techwear Visual"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQwxk6WaG7B2wtf0dse8OeaBRBbaH0xgfwjQ9A4d7xXYZJ5rJNOQEZVQTnj48M1U872rC4vQ3ow--ru3bFnPnsTKvRK-KWBdxku4XriW0UMDpsQJMwoqbxSlVRq0qNbMwZk_OpjU-Bh9luqjCf_ptcqpCuxgqH88frx5qsRn0pmpIGNobaULYIy5hKSGv7LsDPj7GYBWN-Gkm4SmBpFSAd4sZU1a3u9q6-RTl8_UvBAXbrMvDQW5VKUBm7Uyi1fZvPLEEfqz2OPA"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#16111b] via-transparent to-[#16111b]/40" />
        <div className="absolute inset-0 scanlines opacity-20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-[12px] tracking-[0.5em] text-[#ddb7ff] uppercase animate-pulse" style={{ fontFamily: "'Space Mono', monospace" }}>
            Initializing Core Protocol
          </p>
        </div>
      </section>

      {/* Main */}
      <main className="pb-24 w-full max-w-[1440px] mx-auto px-4 md:px-16 pt-12">
        {/* HUD Header */}
        <div className="mb-12 border-l-4 border-[#ddb7ff] pl-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-[42px] md:text-[64px] uppercase leading-none tracking-tighter" style={{ fontFamily: "'Anton', sans-serif" }}>
              PROTO_CORE / 2024
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {["all", "tops", "outer", "bottoms", "lab"].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 text-[14px] tracking-[0.05em] uppercase transition-all ${
                  activeFilter === filter
                    ? "bg-[#ddb7ff] text-[#490080]"
                    : "border border-[#4d4354] hover:border-[#ddb7ff]"
                } ${filter === "lab" ? "text-[#ffb59e] border-[#ffb59e]" : ""}`}
                style={{ fontFamily: "'Archivo Black', sans-serif" }}
              >
                {filter === "all" ? "All" : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="group product-card relative border border-[#4d4354] bg-[#110c15] transition-all hover:border-[#ddb7ff]"
            >
              {/* Badge */}
              {product.badge && (
                <div className="absolute top-4 left-4 z-10">
                  <span
                    className={`px-2 py-1 text-[10px] uppercase ${
                      product.badge === "New Arrival"
                        ? "bg-[#ddb7ff] text-[#490080]"
                        : "bg-[#ffb59e] text-[#521300]"
                    }`}
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  >
                    {product.badge}
                  </span>
                </div>
              )}

              {/* Image */}
              <div className="relative aspect-[4/5] overflow-hidden bg-[#16111b]">
                <img
                  alt={product.name}
                  src={product.image}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Alt face */}
                {product.altIsImage && product.altImage ? (
                  <div className="alt-face absolute inset-0 opacity-0 transition-opacity duration-300">
                    <img
                      alt={`${product.name} detail`}
                      src={product.altImage}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="alt-face absolute inset-0 opacity-0 transition-opacity duration-300 bg-[#ffb59e]/10 flex items-center justify-center backdrop-blur-sm">
                    <div className="text-center p-8 border border-[#ffb59e]/40">
                      <p className="mb-2 text-[#ffb59e] text-[12px] tracking-[0.1em]" style={{ fontFamily: "'Space Mono', monospace" }}>
                        SENSORS: ACTIVE
                      </p>
                      <p className="text-xs" style={{ fontFamily: "'Space Mono', monospace" }}>
                        INTEGRATED HEAD-UP DISPLAY<br />
                        THERMAL IMAGING V2.0<br />
                        OXYGEN RECYCLER
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-6 border-t border-[#4d4354]">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[12px] tracking-[0.1em] text-[#ddb7ff] uppercase" style={{ fontFamily: "'Space Mono', monospace" }}>
                      {product.model}
                    </p>
                    <h3 className="text-2xl uppercase mt-1" style={{ fontFamily: "'Anton', sans-serif" }}>
                      {product.name}
                    </h3>
                  </div>
                  <span className="text-2xl text-[#ffb59e]" style={{ fontFamily: "'Anton', sans-serif" }}>
                    {product.price}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <span className="material-symbols-outlined text-sm opacity-50">{product.icon}</span>
                    <span className="text-[10px] opacity-50" style={{ fontFamily: "'Space Mono', monospace" }}>
                      {product.coord}
                    </span>
                  </div>
                  <button className="bg-[#ddb7ff]/10 border border-[#ddb7ff]/20 hover:bg-[#ddb7ff] hover:text-[#490080] px-4 py-2 text-[14px] tracking-[0.05em] uppercase transition-all" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
                    Select
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-20 flex flex-col items-center gap-6">
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 border border-[#4d4354] flex items-center justify-center hover:border-[#ddb7ff] group transition-all">
              <span className="material-symbols-outlined text-[#cfc2d6] group-hover:text-[#ddb7ff]">chevron_left</span>
            </button>
            <div className="text-[12px] tracking-[0.1em] flex gap-4" style={{ fontFamily: "'Space Mono', monospace" }}>
              <span className="text-[#ddb7ff]">01</span>
              <span className="opacity-30">/</span>
              <span className="hover:text-[#ddb7ff] transition-all cursor-pointer">02</span>
              <span className="opacity-30">/</span>
              <span className="hover:text-[#ddb7ff] transition-all cursor-pointer">03</span>
            </div>
            <button className="w-10 h-10 border border-[#4d4354] flex items-center justify-center hover:border-[#ddb7ff] group transition-all">
              <span className="material-symbols-outlined text-[#cfc2d6] group-hover:text-[#ddb7ff]">chevron_right</span>
            </button>
          </div>
          <div className="w-full max-w-xs h-px bg-[#4d4354] relative">
            <div className="absolute left-0 top-0 h-full w-1/3 bg-[#ddb7ff]" />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 px-4 md:px-16 border-t border-[rgba(255,255,255,0.05)] bg-[#110c15]">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 max-w-[1440px] mx-auto">
          <img src="/assets/streetplayr-logo.png" alt="StreetplayR" className="h-12 w-auto object-contain brightness-75" />
          <div className="flex gap-8">
            <a href="#" className="text-[12px] tracking-[0.1em] text-[#cfc2d6] hover:text-[#ffb59e] transition-all opacity-80 hover:opacity-100" style={{ fontFamily: "'Space Mono', monospace" }}>Terms</a>
            <a href="#" className="text-[12px] tracking-[0.1em] text-[#cfc2d6] hover:text-[#ffb59e] transition-all opacity-80 hover:opacity-100" style={{ fontFamily: "'Space Mono', monospace" }}>Privacy</a>
            <a href="#" className="text-[12px] tracking-[0.1em] text-[#cfc2d6] hover:text-[#ffb59e] transition-all opacity-80 hover:opacity-100" style={{ fontFamily: "'Space Mono', monospace" }}>Logistics</a>
            <a href="#" className="text-[12px] tracking-[0.1em] text-[#cfc2d6] hover:text-[#ffb59e] transition-all opacity-80 hover:opacity-100" style={{ fontFamily: "'Space Mono', monospace" }}>Contact</a>
          </div>
          <div className="text-[12px] tracking-[0.1em] opacity-60" style={{ fontFamily: "'Space Mono', monospace" }}>
            &copy; 2024 STREETPLAYR // CORE_OS_V1.0
          </div>
        </div>
      </footer>

      {/* Decorative HUD */}
      <div className="fixed top-24 left-6 hidden xl:block pointer-events-none">
        <div className="text-[10px] opacity-20 -rotate-90 origin-left" style={{ fontFamily: "'Space Mono', monospace" }}>
          SCAN_MODE: ACTIVE // FRAME_RATE: 60FPS // GRID_X: 144.22
        </div>
      </div>
      <div className="fixed bottom-24 right-6 hidden xl:block pointer-events-none text-right">
        <div className="text-[10px] opacity-20" style={{ fontFamily: "'Space Mono', monospace" }}>
          [ REC ] SYSTEM_STATUS_OK<br />
          LAT: 35.6895 N / LONG: 139.6917 E
        </div>
      </div>
    </div>
  );
}
