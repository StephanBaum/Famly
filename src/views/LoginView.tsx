import React, { useState } from 'react';
import { useFamily } from '../context/FamilyContext';
import { FamilyMember } from '../types';
import { Lock, Delete, Sparkles } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { members, login } = useFamily();
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSelectMember = (member: FamilyMember) => {
    setSelectedMember(member);
    setPinInput('');
    setErrorMessage(null);

    // If member has no PIN (or kids), log in immediately!
    if (!member.pin) {
      login(member.id);
    }
  };

  const handleKeyPress = (digit: string) => {
    if (pinInput.length < 4) {
      const nextPin = pinInput + digit;
      setPinInput(nextPin);
      setErrorMessage(null);

      // Auto-submit on 4th digit
      if (nextPin.length === 4 && selectedMember) {
        const result = login(selectedMember.id, nextPin);
        if (!result.success) {
          setErrorMessage(result.message || 'Incorrect PIN');
          setTimeout(() => setPinInput(''), 600);
        }
      }
    }
  };

  const handleDeleteDigit = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FA] flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="max-w-md w-full text-center space-y-6">
        
        {/* Brand Header */}
        <div className="space-y-2 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-[#58CC02] border-b-4 border-[#46A302] flex items-center justify-center text-3xl mx-auto shadow-md">
            🏡
          </div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">Famly</h1>
          <p className="text-sm font-extrabold text-stone-400">
            Who is coordinating on this device?
          </p>
        </div>

        {/* Member Avatar Grid */}
        {!selectedMember || !selectedMember.pin ? (
          <div className="grid grid-cols-2 gap-3.5 pt-2 animate-in fade-in slide-in-from-bottom-3">
            {members.map((member) => (
              <button
                key={member.id}
                onClick={() => handleSelectMember(member)}
                className="duo-btn duo-btn-white p-4 rounded-3xl flex flex-col items-center justify-center gap-2 hover:border-emerald-400 transition-all group"
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border-2 group-hover:scale-105 transition-transform"
                  style={{
                    backgroundColor: `${member.color}15`,
                    borderColor: `${member.color}40`,
                  }}
                >
                  {member.avatar}
                </div>
                <div className="text-center">
                  <strong className="block text-sm font-black text-stone-900">
                    {member.name}
                  </strong>
                  <span className="text-[11px] font-bold text-stone-400">
                    {member.role}
                  </span>
                  {member.pin && (
                    <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      <Lock className="w-2.5 h-2.5" /> PIN
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* PIN KEYPAD SCREEN FOR PROTECTED PROFILES (e.g. Parents) */
          <div className="duo-card p-6 bg-white space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b-2 border-stone-100 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedMember.avatar}</span>
                <div className="text-left">
                  <h2 className="text-base font-black text-stone-900">{selectedMember.name}</h2>
                  <p className="text-xs font-bold text-stone-400">{selectedMember.role}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedMember(null);
                  setPinInput('');
                  setErrorMessage(null);
                }}
                className="duo-btn duo-btn-white px-3 py-1.5 text-xs font-black rounded-xl"
              >
                Change
              </button>
            </div>

            <div>
              <p className="text-xs font-extrabold text-stone-600 mb-3">
                Enter 4-digit Passcode
              </p>

              {/* 4 PIN Dots */}
              <div className="flex justify-center items-center gap-3 py-2">
                {[0, 1, 2, 3].map((index) => {
                  const isFilled = pinInput.length > index;
                  return (
                    <div
                      key={index}
                      className={`w-4 h-4 rounded-full border-2 transition-all ${
                        isFilled
                          ? 'bg-emerald-500 border-emerald-600 scale-110'
                          : 'border-stone-300 bg-stone-100'
                      }`}
                    />
                  );
                })}
              </div>

              {errorMessage && (
                <p className="text-xs font-black text-rose-600 mt-2 animate-bounce">
                  {errorMessage}
                </p>
              )}

              <p className="text-[11px] font-bold text-stone-400 mt-1">
                Demo parent PIN is <strong className="text-stone-700">1234</strong>
              </p>
            </div>

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeyPress(digit)}
                  className="duo-btn duo-btn-white py-3.5 text-lg font-black rounded-2xl active:scale-95"
                >
                  {digit}
                </button>
              ))}
              <div />
              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                className="duo-btn duo-btn-white py-3.5 text-lg font-black rounded-2xl active:scale-95"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleDeleteDigit}
                className="duo-btn duo-btn-white py-3.5 flex items-center justify-center text-stone-500 rounded-2xl active:scale-95"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Quick 1-tap bypass button for convenience */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => login(selectedMember.id, selectedMember.pin)}
                className="text-xs font-black text-emerald-600 hover:text-emerald-800 underline flex items-center justify-center gap-1 mx-auto"
              >
                <Sparkles className="w-3 h-3" />
                <span>Quick log in without PIN (Demo Mode)</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
