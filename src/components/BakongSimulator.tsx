import React, { useState, useEffect } from "react";
import { 
  Smartphone, 
  ChevronDown, 
  Settings, 
  Camera, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  Unlock,
  CornerDownLeft,
  X,
  ShieldCheck,
  RefreshCw,
  Coins
} from "lucide-react";
import { BakongSettings } from "../types";

interface BakongSimulatorProps {
  settings: BakongSettings;
  activeCheckoutKHQR: { invoiceNo: string; amount: number; currency: "USD" | "KHR"; qrStr: string } | null;
  onConfirmPayment: (method: "Cash" | "Bakong_KHQR", extTxId: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function BakongSimulator({ 
  settings, 
  activeCheckoutKHQR, 
  onConfirmPayment,
  isOpen,
  setIsOpen
}: BakongSimulatorProps) {
  // State
  const [phoneState, setPhoneState] = useState<"IDLE" | "DETECTOR" | "PIN_PROMPT" | "SUCCESS">("IDLE");
  const [enteredPin, setEnteredPin] = useState<string>("");
  const [isScanning, setIsScanning] = useState(true);
  const [successTxId, setSuccessTxId] = useState("");

  const pinDigits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "OK"];

  // Direct state sync to active QR on terminal
  useEffect(() => {
    if (!isOpen) return;

    if (activeCheckoutKHQR) {
      setPhoneState("DETECTOR");
      setIsScanning(true);
      const timer = setTimeout(() => {
        setIsScanning(false);
        setPhoneState("PIN_PROMPT");
      }, 2000); // 2 seconds of camera analyzing
      return () => clearTimeout(timer);
    } else {
      setPhoneState("IDLE");
      setEnteredPin("");
    }
  }, [activeCheckoutKHQR, isOpen]);

  // PIN keypad dial logic
  const handlePinPress = (digit: string) => {
    if (digit === "C") {
      setEnteredPin("");
    } else if (digit === "OK") {
      if (enteredPin.length === 4) {
        submitSimulatedPayment();
      } else {
        alert("Please enter a 4-digit PIN.");
      }
    } else {
      if (enteredPin.length < 4) {
        setEnteredPin(prev => prev + digit);
      }
    }
  };

  // Submit trigger to parent callback
  const submitSimulatedPayment = () => {
    const extTxId = `BKNG-BLOCK-${Math.floor(100000 + Math.random() * 900000)}`;
    setSuccessTxId(extTxId);
    setPhoneState("SUCCESS");

    // Complete order on cashiers POS terminal
    onConfirmPayment("Bakong_KHQR", extTxId);
  };

  // Skip PIN scan trigger
  const handleQuickSlidePay = () => {
    submitSimulatedPayment();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-4 bottom-4 z-50 animate-slide-up select-none">
      
      {/* Visual mobile phone container styling */}
      <div className="w-[280px] h-[520px] bg-slate-950 rounded-[35px] border-[5px] border-slate-800 shadow-2xl relative overflow-hidden flex flex-col justify-between shrink-0">
        
        {/* Phone Speaker & Camera Notch */}
        <div className="absolute top-1.5 inset-x-0 mx-auto w-24 h-4 bg-slate-800 rounded-full z-30 flex items-center justify-center">
          {/* Subtle speaker line */}
          <div className="w-12 h-1 bg-slate-900 rounded-full"></div>
          {/* Subtle sensor camera circle */}
          <div className="w-1.5 h-1.5 bg-indigo-900 rounded-full ml-1.5"></div>
        </div>

        {/* TOP STATUS BAR (iPhone/Android alike) */}
        <div className="h-8 bg-[#8B0E1E] text-white flex items-center justify-between px-5 pt-1 text-[9px] font-sans shrink-0 z-20 font-bold select-none leading-none">
          <span>09:41 AM</span>
          <div className="flex items-center gap-1">
            <span className="text-[7.5px] uppercase tracking-wider text-red-200">LTE</span>
            <span>📶</span>
            <span>🔋</span>
          </div>
        </div>

        {/* BAKONG WALLET MOBILE INTERFACE BODY */}
        <div className="flex-1 bg-gradient-to-b from-[#8B0E1E] via-[#A81F30]/90 to-[#6E0A14] flex flex-col overflow-hidden text-neutral-100 font-sans relative">
          
          {/* APP HEADER */}
          <div className="p-3 border-b border-rose-900/30 flex items-center justify-between relative z-10 select-none">
            <div className="flex items-center gap-1">
              <span className="bg-white text-[#8B0E1E] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center font-mono shadow leading-none">BK</span>
              <span className="text-xs font-black tracking-widest text-white">BAKONG</span>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition"
              title="Close simulator view"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* DYNAMIC SCENARIO PANELS */}
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col justify-between">
            
            {/* SCENARIO 1: IDLE - Phone scanner is listening */}
            {phoneState === "IDLE" && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 my-auto">
                <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center animate-pulse border border-white/20">
                  <Camera className="w-6 h-6 text-red-200" />
                </div>
                
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-red-100">Bakong pay Scanner</h4>
                  <p className="text-[10px] text-red-200/80 leading-normal max-w-[200px] mt-1.5">
                    Your simulated phone is searching for a KHQR code to pay.
                  </p>
                </div>

                <div className="bg-black/25 p-3 rounded-xl border border-rose-900/20 text-left space-y-1.5">
                  <p className="text-[9.5px] font-bold text-amber-300">💡 How to initiate:</p>
                  <ol className="text-[9px] text-[#fca5a5] list-decimal list-inside leading-tight space-y-1">
                    <li>Launch the POS terminal module.</li>
                    <li>Add items to cart ticket sheet.</li>
                    <li>Click payment Proceed & choose <strong>KHQR Bakong</strong>.</li>
                    <li>This wallet will auto-detect the bill.</li>
                  </ol>
                </div>
              </div>
            )}

            {/* SCENARIO 2: DETECTOR - Scans and decodes camera frame */}
            {phoneState === "DETECTOR" && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 my-auto">
                {/* Visual Camera Scan Area with green laser animation */}
                <div className="w-36 h-36 border-2 border-dashed border-emerald-500 rounded-2xl relative p-1.5 flex items-center justify-center overflow-hidden bg-slate-900/35 select-none shrink-0 shadow-inner">
                  <div className="absolute inset-x-0 h-0.5 bg-emerald-400 shadow shadow-emerald-500 animate-bounce-slow top-[15%]"></div>
                  
                  {/* Miniature QR */}
                  <div className="opacity-45">
                    <span>📱 Scanning</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#a7f3d0] flex items-center justify-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Detecting QR...</span>
                  </h4>
                  <p className="text-[10px] text-red-200/80 mt-1 max-w-[190px] leading-relaxed mx-auto">
                    Interpreting EMVCo standard tags for <strong>{settings.merchantName}</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* SCENARIO 3: PIN_PROMPT - Scanned details detected, ask for 4-digit security PIN */}
            {phoneState === "PIN_PROMPT" && activeCheckoutKHQR && (
              <div className="flex-1 flex flex-col justify-between h-full">
                
                {/* Bill Specs Detected Summary */}
                <div className="bg-black/30 border border-white/10 rounded-xl p-2 px-3 text-left space-y-1 select-text">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[9px] uppercase font-bold text-red-200 font-mono tracking-wider">Merchant:</span>
                    <span className="text-[10px] font-extrabold text-white truncate max-w-[130px]">{settings.merchantName}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[9px] uppercase font-bold text-red-200 font-mono tracking-wider">Bank Gateway:</span>
                    <span className="text-[10px] font-mono font-semibold text-emerald-400">{settings.acquirerId}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[9px] uppercase font-bold text-red-200 font-mono tracking-wider">Invoice No:</span>
                    <span className="text-[10px] font-mono text-white tracking-tight">{activeCheckoutKHQR.invoiceNo}</span>
                  </div>
                  <hr className="border-white/10 my-1 border-dashed" />
                  
                  {/* Amount Payable */}
                  <div className="text-center py-1 bg-red-950/40 rounded border border-red-900/40 mt-1.5">
                    <p className="text-[8px] tracking-wider text-red-300 font-mono uppercase font-bold">Total Bill amount</p>
                    <p className="text-lg font-black font-mono text-amber-300">
                      {activeCheckoutKHQR.currency === "USD" ? `$ ${activeCheckoutKHQR.amount.toFixed(2)}` : `៛ ${activeCheckoutKHQR.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    </p>
                  </div>
                </div>

                {/* Secret PIN bullet dials */}
                <div className="flex flex-col items-center justify-center py-1 shrink-0 select-none">
                  <p className="text-[9px] text-[#fca5a5] font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <span>Enter Secret Wallet PIN:</span>
                  </p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((num) => {
                      const isActive = enteredPin.length >= num;
                      return (
                        <span
                          key={num}
                          className={`w-3 h-3 rounded-full border border-white/30 flex items-center justify-center transition-all ${
                            isActive ? "bg-white scale-110 shadow shadow-white/50" : "bg-transparent"
                          }`}
                        ></span>
                      );
                    })}
                  </div>
                </div>

                {/* Keypad block typical of bank apps */}
                <div className="grid grid-cols-3 gap-1 px-3 select-none shrink-0 mb-1">
                  {pinDigits.map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handlePinPress(digit)}
                      className="bg-white/5 hover:bg-white/15 border border-white/5 text-white font-extrabold text-xs py-2 rounded-lg flex items-center justify-center font-mono transition-all active:scale-90"
                    >
                      {digit}
                    </button>
                  ))}
                </div>

                {/* Instant slide pay backup button */}
                <button
                  type="button"
                  onClick={handleQuickSlidePay}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] py-2 rounded-lg tracking-wider text-center uppercase transition active:scale-95 shadow-md flex items-center justify-center gap-1 select-none shrink-0 mb-1"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Slide to Pay Instantly ⚡</span>
                </button>
              </div>
            )}

            {/* SCENARIO 4: SUCCESS - Payment approved */}
            {phoneState === "SUCCESS" && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 my-auto select-text">
                <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white select-none animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-black text-emerald-300 uppercase tracking-widest leading-none">
                    SUCCESSFULLY PAID!
                  </h4>
                  <p className="text-[10px] text-emerald-100">
                    Settled on Bakong permissioned Ledger.
                  </p>
                </div>

                <div className="bg-black/30 border border-emerald-900/30 p-3 rounded-xl text-left text-[9px] space-y-1 py-2 max-w-[210px] mx-auto font-mono">
                  <p className="text-[#a7f3d0] font-bold border-b border-white/5 pb-1 select-all">Receipt Approved</p>
                  
                  {successTxId && (
                    <p className="text-[#a7f3d0] break-words uppercase">
                      Tx: <strong className="font-extrabold">{successTxId}</strong>
                    </p>
                  )}
                  
                  <p className="text-red-200">Merchant: {settings.merchantId}</p>
                </div>

                <button
                  onClick={() => {
                    setPhoneState("IDLE");
                    setEnteredPin("");
                  }}
                  className="bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-[10px] py-1.5 px-5 rounded-lg select-none transition"
                >
                  Confirm Close
                </button>
              </div>
            )}

          </div>

          {/* LOWER DECORATOR CAPABILITIES FOOTER BACKGROUND */}
          <div className="p-2 border-t border-rose-900/10 text-center select-none bg-slate-900/40 text-[8px] text-rose-300 font-mono">
            🛡️ NATIONAL BANK OF CAMBODIA
          </div>

        </div>

        {/* Smartphone Home Bar overlay Indicator */}
        <div className="h-6 bg-slate-950 flex items-center justify-center shrink-0 z-20">
          <div className="w-24 h-1 bg-slate-700 rounded-full cursor-pointer hover:bg-slate-500 transition-all"></div>
        </div>

      </div>

    </div>
  );
}
