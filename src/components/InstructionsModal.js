import React from 'react';

const InstructionsModal = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-gray-800 rounded-lg p-6 max-w-lg mx-auto shadow-lg text-right transform scale-95 md:scale-100 transition-transform">
                <h3 className="text-2xl font-bold mb-4">تعليمات اللعبة</h3>
                <p className="mb-2">هذه اللعبة تدور حول **الجاسوس** و**اللاعبين**.</p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>**اللاعبون** يعرفون كلمة سرية واحدة.</li>
                    <li>**الجاسوس** لا يعرف الكلمة الحقيقية، ولكنه يعرف كلمة مختلفة قليلاً.</li>
                    <li>هدف اللاعبين هو تحديد الجاسوس من خلال الأسئلة والأجوبة.</li>
                    <li>هدف الجاسوس هو التظاهر بأنه لاعب عادي ومحاولة تخمين الكلمة السرية.</li>
                    <li>بعد المناقشة، يصوت اللاعبون على من يعتقدون أنه الجاسوس.</li>
                    <li>إذا تم التصويت على الجاسوس، فلديه فرصة أخيرة لتخمين الكلمة.</li>
                    <li>إذا خمن الجاسوس الكلمة بشكل صحيح، يفوز. وإلا، يفوز اللاعبون.</li>
                </ul>
                <button onClick={onClose} className="w-full mt-4 p-3 bg-teal-600 rounded-lg hover:bg-teal-700">فهمت!</button>
            </div>
        </div>
    );
};

export default InstructionsModal;
