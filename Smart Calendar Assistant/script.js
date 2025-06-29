// حالة المحادثة والسياق
        const conversationContext = {
            currentTopic: null,
            pendingAction: null,
            userData: {
                remainingVacation: 21,
                remainingEmergency: 7,
                usedPermissions: 2
            },
            conversationHistory: []
        };

        // تهيئة المحادثة عند التحميل
        document.addEventListener('DOMContentLoaded', function() {
            loadConversationHistory();
        });

        // تحميل سجل المحادثة من localStorage
        function loadConversationHistory() {
            const savedHistory = localStorage.getItem('conversationHistory');
            if (savedHistory) {
                conversationContext.conversationHistory = JSON.parse(savedHistory);
                renderConversationHistory();
            }
        }

        // عرض سجل المحادثة
        function renderConversationHistory() {
            const chatBox = document.getElementById('chat-box');
            chatBox.innerHTML = '';
            
            conversationContext.conversationHistory.forEach(msg => {
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${msg.role}-message`;
                messageDiv.textContent = msg.content;
                chatBox.appendChild(messageDiv);
            });
            
            chatBox.scrollTop = chatBox.scrollHeight;
        }

        // إرسال رسالة
        async function sendMessage() {
            const userInput = document.getElementById('user-input');
            const message = userInput.value.trim();
            
            if (!message) return;
            
            // عرض رسالة المستخدم
            addMessageToChat('user', message);
            userInput.value = '';
            
            // عرض مؤشر الكتابة
            showTypingIndicator();
            
            // الحصول على الرد
            const response = await getAIResponse(message);
            
            // إخفاء مؤشر الكتابة وإضافة الرد
            hideTypingIndicator();
            addMessageToChat('bot', response);
            
            // تحديث الردود السريعة بناءً على السياق
            updateQuickReplies();
        }

        // إرسال رد سريع
        function sendQuickReply(reply) {
            document.getElementById('user-input').value = reply;
            sendMessage();
        }



        // تحديث الردود السريعة بناءً على السياق
       
    function updateQuickReplies() {
    const quickReplies = document.getElementById('quick-replies');
    quickReplies.innerHTML = '';
    
    // الحصول على آخر رسالة من المستخدم
    const lastUserMessage = conversationContext.conversationHistory
        .filter(msg => msg.role === 'user')
        .pop()?.content || '';
    
    // تحديد الردود المناسبة بناءً على تحليل السؤال
    const suggestedReplies = getSuggestedReplies(lastUserMessage);
    
    // عرض الردود السريعة
    suggestedReplies.forEach(reply => {
        const button = document.createElement('button');
        button.className = 'quick-reply';
        button.textContent = reply.text;
        button.onclick = () => sendQuickReply(reply.text);
        button.title = reply.tooltip || ''; // إضافة تلميح إذا وجد
        
        // إضافة أيقونة إذا كانت متوفرة
        if (reply.icon) {
            button.innerHTML = `<i class="fas fa-${reply.icon}"></i> ${reply.text}`;
        }
        
        quickReplies.appendChild(button);
    });
}

// دالة مساعدة لتحديد الردود المقترحة
function getSuggestedReplies(userMessage) {
    const lowerCaseMessage = userMessage.toLowerCase();

    // إذا كان السؤال عن الإجازات
    if (/إجازة|اجازة|رصيد إجازات|طلب إجازة/.test(lowerCaseMessage)) {
        return [
            { text: 'كم عدد إجازت اعتيادي؟', icon: 'calendar-check' },
            { text: 'كم عدد إجازة سنوية؟', icon: 'calendar-alt' },
            { text: 'كم عدد إجازة مرضية؟', icon: 'file-medical' },
            { text: 'كم عدد إجازة عارضة؟', icon: 'calendar-exclamation' },
            { text: 'كم عدد إجازة راحة؟', icon: 'bed' },
            { text: 'كيف أطلب إجازة؟', icon: 'calendar-plus' }
        ];
    }

    // إذا كان السؤال عن الأذونات
    if (/إذن|اذن|إذونات|أذونات/.test(lowerCaseMessage)) {
        return [
            { text: 'كم عدد إذن تأخير؟', icon: 'clock' },
            { text: 'كم عدد إذن طبي؟', icon: 'user-md' },
            { text: 'كم عدد إذن شخصي؟', icon: 'user-clock' },
            { text: 'كم عدد إذن مصلحي؟', icon: 'file-alt' },
            { text: 'ما هو حد الأذونات الشهرية؟', icon: 'chart-pie' }
        ];
    }

    // إذا كان السؤال عن المهمات أو غيرها
    if (/مأمورية|تكليف|تدريب|بدل/.test(lowerCaseMessage)) {
        return [
            { text: 'كم عدد مأمورية؟', icon: 'map-marker-alt' },
            { text: 'كم عدد تكليف؟', icon: 'briefcase' },
            { text: 'كم عدد تدريب؟', icon: 'chalkboard-teacher' },
            { text: 'كم عدد بدل؟', icon: 'money-bill' }
        ];
    }

    // إذا كان السؤال عن العطلات
    if (/عطلة|اجازة رسمية|مناسبة/.test(lowerCaseMessage)) {
        return [
            { text: 'ما هي العطلة القادمة؟', icon: 'calendar-day' },
            { text: 'كم باقي على عطلة نهاية الأسبوع؟', icon: 'hourglass-half' },
            { text: 'ما هي إجازات هذا الشهر؟', icon: 'calendar-alt' }
        ];
    }

    // إذا كان السؤال عن البيانات الشخصية
    if (/بياناتي|معلوماتي|تحديث بيانات/.test(lowerCaseMessage)) {
        return [
            { text: 'كيف أغير صورتي الشخصية؟', icon: 'user-edit' },
            { text: 'كيف أعدل بيانات الاتصال؟', icon: 'phone-alt' },
            { text: 'كيف أضيف مؤهلاتي؟', icon: 'graduation-cap' }
        ];
    }

    // الردود الافتراضية
    return [
        { text: 'كيف أطلب إجازة؟', icon: 'calendar-plus' },
        { text: 'كيف أبلغ عن مشكلة؟', icon: 'exclamation-triangle' },
        { text: 'أين أجد سياسات الشركة؟', icon: 'file-contract' },
        { text: 'كيف أتواصل مع مديري؟', icon: 'user-tie' }
    ];
}

        // إضافة رسالة إلى المحادثة
        
function addMessageToChat(role, content) {
    const chatBox = document.getElementById('chat-box');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;

    // ✅ السماح بعرض HTML فقط إذا كانت رسالة من البوت
    if (role === 'bot') {
        messageDiv.innerHTML = content;
    } else {
        messageDiv.textContent = content;
    }

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    conversationContext.conversationHistory.push({ role, content });
    localStorage.setItem('conversationHistory', JSON.stringify(conversationContext.conversationHistory));

    updateConversationContext(role, content);
}


        // عرض مؤشر الكتابة
        function showTypingIndicator() {
            const chatBox = document.getElementById('chat-box');
            
            const typingDiv = document.createElement('div');
            typingDiv.className = 'message bot-message typing-indicator';
            typingDiv.id = 'typing-indicator';
            
            typingDiv.innerHTML = `
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            `;
            
            chatBox.appendChild(typingDiv);
            chatBox.scrollTop = chatBox.scrollHeight;
        }

        // إخفاء مؤشر الكتابة
        function hideTypingIndicator() {
            const typingIndicator = document.getElementById('typing-indicator');
            if (typingIndicator) {
                typingIndicator.remove();
            }
        }

        // تحديث سياق المحادثة
        function updateConversationContext(role, content) {
            if (role === 'user') {
                // تحليل رسالة المستخدم لتحديث السياق
                if (content.includes('إجازة') || content.includes('إجازات')) {
                    conversationContext.currentTopic = 'vacation';
                    
                    if (content.includes('عارضة')) {
                        conversationContext.pendingAction = 'request_emergency_leave';
                    } else if (content.includes('اعتيادية')) {
                        conversationContext.pendingAction = 'request_regular_leave';
                    }
                } else if (content.includes('إذن') || content.includes('أذونات')) {
                    conversationContext.currentTopic = 'permissions';
                } else if (content.includes('بديل')) {
                    conversationContext.currentTopic = 'substitute';
                }
            }
        }

        // محرك الذكاء الاصطناعي المتقدم
        async function getAIResponse(userMessage) {
            // محاكاة التأخير لتبدو كأنها عملية معالجة حقيقية
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
            
            // تحويل الرسالة إلى حروف صغيرة لتسهيل المطابقة
            const lowerCaseMessage = userMessage.toLowerCase();
            
            // نظام الردود الذكية مع السياق
            if (conversationContext.pendingAction === 'request_emergency_leave') {
                conversationContext.pendingAction = null;
                return `لقد قمت بتسجيل طلب إجازة عارضة لك. باقي لديك ${conversationContext.userData.remainingEmergency} أيام عارضة لهذا العام. هل تريد أي شيء آخر؟`;
            }
            
            if (conversationContext.pendingAction === 'request_regular_leave') {
                conversationContext.pendingAction = null;
                return `تم تسجيل طلب إجازتك الاعتيادية. باقي لديك ${conversationContext.userData.remainingVacation} يوم إجازة لهذا العام. هل تحتاج إلى مساعدة أخرى؟`;
            }
            
// الردود العامة
if (lowerCaseMessage.includes('مرحبا') || lowerCaseMessage.includes('اهلا')) {
    return 'مرحباً بك! كيف يمكنني مساعدتك اليوم؟';
} else if (
    (
        lowerCaseMessage.includes('كم عدد') ||
        lowerCaseMessage.includes('كم مره') ||
        lowerCaseMessage.includes('عدد مرات') ||
        lowerCaseMessage.includes('كم اخذت') ||
        lowerCaseMessage.includes('كم عندي') ||
        lowerCaseMessage.includes('ما عدد') ||
        lowerCaseMessage.includes('احصائيه') ||
        lowerCaseMessage.includes('احصائيات')
    ) &&
    (
        lowerCaseMessage.includes('إذن شخصي') ||
        lowerCaseMessage.includes('إذن مصلحي') ||
        lowerCaseMessage.includes('إذن تأخير') ||
        lowerCaseMessage.includes('إذن طبي') ||
        lowerCaseMessage.includes('مأمورية') ||
        lowerCaseMessage.includes('تكليف') ||
        lowerCaseMessage.includes('تدريب') ||
        lowerCaseMessage.includes('بدل') ||
        lowerCaseMessage.includes('إجازة عارضة') ||
        lowerCaseMessage.includes('إجازة اعتيادي') ||
        lowerCaseMessage.includes('إجازة سنوية') ||
        lowerCaseMessage.includes('إجازة راحة') ||
        lowerCaseMessage.includes('إجازة مرضية')
    )
) {
    const username = localStorage.getItem('username') || 'بك';
    const leaveData = JSON.parse(localStorage.getItem('leaveData') || '{}');

    let targetType = '';
    if (lowerCaseMessage.includes('إذن شخصي')) targetType = 'إذن شخصي';
    else if (lowerCaseMessage.includes('إذن مصلحي')) targetType = 'إذن مصلحي';
    else if (lowerCaseMessage.includes('إذن تأخير')) targetType = 'إذن تأخير';
    else if (lowerCaseMessage.includes('إذن طبي')) targetType = 'إذن طبي';
    else if (lowerCaseMessage.includes('مأمورية')) targetType = 'مأمورية';
    else if (lowerCaseMessage.includes('تكليف')) targetType = 'تكليف';
    else if (lowerCaseMessage.includes('تدريب')) targetType = 'تدريب';
    else if (lowerCaseMessage.includes('بدل')) targetType = 'بدل';
    else if (lowerCaseMessage.includes('إجازة عارضة')) targetType = 'إجازة عارضة';
    else if (lowerCaseMessage.includes('إجازة اعتيادي')) targetType = 'إجازة اعتيادي';
    else if (lowerCaseMessage.includes('إجازة سنوية')) targetType = 'إجازة سنوية';
    else if (lowerCaseMessage.includes('إجازة راحة')) targetType = 'إجازة راحة';
    else if (lowerCaseMessage.includes('إجازة مرضية')) targetType = 'إجازة مرضية';

    let count = 0;
    let dates = [];

    for (const year in leaveData) {
        for (const userId in leaveData[year]) {
            const days = leaveData[year][userId];
            for (const date in days) {
                const leaveType = days[date];
                if (leaveType === targetType) {
                    count++;
                    dates.push(date);
                }
            }
        }
    }

    if (count > 0) {
        const formattedDates = dates.join(', ');
        return `مرحبًا ${username}!\nلقد تم تسجيل ${count} مرة من نوع "${targetType}".\nالتواريخ: ${formattedDates}`;
    } else {
        return `مرحبًا ${username}!\nلم يتم العثور على أي "${targetType}" في السجلات.`;
    }



             } else if (lowerCaseMessage.includes('شكرا') || lowerCaseMessage.includes('شكر')) {
                const username = localStorage.getItem('username') || '';
                return `العفو يا${username}! دائمًا سعيد بمساعدتك. هل هناك شيء آخر تحتاجه؟`;

            } else if (lowerCaseMessage.includes('انواع الإجازات') || lowerCaseMessage.includes('أنواع الإجازات')) {
                conversationContext.currentTopic = 'vacation';
                return 'حسناً، لدينا عدة أنواع من الإجازات:\n1. إجازة عارضة (7 أيام سنوياً)\n2. إجازة اعتيادية (30 يوم سنوياً)\nأي نوع تريد طلبه؟';
            } else if (lowerCaseMessage.includes('عارضة')) {
                conversationContext.pendingAction = 'request_emergency_leave';
                return 'كم يوم تريد أخذ إجازة عارضة؟ لديك ' + conversationContext.userData.remainingEmergency + ' أيام متبقية هذا العام.';
            } else if (lowerCaseMessage.includes('اعتيادية')) {
                conversationContext.pendingAction = 'request_regular_leave';
                return 'كم يوم تريد أخذ إجازة اعتيادية؟ لديك ' + conversationContext.userData.remainingVacation + ' أيام متبقية هذا العام.';
            } else if (lowerCaseMessage.includes('باقي') && lowerCaseMessage.includes('إجازة')) {
                return `حالياً لديك:\n- ${conversationContext.userData.remainingVacation} يوم إجازة اعتيادية\n- ${conversationContext.userData.remainingEmergency} يوم إجازة عارضة\n- ${3 - conversationContext.userData.usedPermissions} إذن متبقي هذا الشهر`;
            }else if (
    lowerCaseMessage.includes('ما هو حد الأذونات الشهرية') ||
    lowerCaseMessage.includes('ما هو حد الاذونات الشهرية')
) {
    const leaveData = JSON.parse(localStorage.getItem('leaveData') || '{}');
    const username = localStorage.getItem('username') || 'بك';

    // أنواع الأذونات
    const permissionTypes = {
        'إذن شخصي': 0,
        'إذن مصلحي': 0,
        'إذن تأخير': 0
    };

    // الحصول على الشهر والسنة الحالية
    const now = new Date();
    const currentMonth = now.getMonth(); // 0 - 11
    const currentYear = now.getFullYear();

    // التحقق من الأذونات المسجلة في الشهر الحالي فقط
    for (const year in leaveData) {
        for (const userId in leaveData[year]) {
            const days = leaveData[year][userId];
            for (const date in days) {
                const type = days[date];
                const entryDate = new Date(date);
                if (
                    entryDate.getFullYear() === currentYear &&
                    entryDate.getMonth() === currentMonth &&
                    permissionTypes.hasOwnProperty(type)
                ) {
                    permissionTypes[type]++;
                }
            }
        }
    }

    // إعداد الرد
    let response = `مرحبًا ${username}!\n`;
    response += `🔹 الحد الشهري:\n`;
    response += `- إذن شخصي: 3\n- إذن مصلحي: 3\n- إذن تأخير: 3\n\n`;

    response += `🔸 الأذونات المستخدمة هذا الشهر:\n`;
    response += `- إذن شخصي: ${permissionTypes['إذن شخصي']}\n`;
    response += `- إذن مصلحي: ${permissionTypes['إذن مصلحي']}\n`;
    response += `- إذن تأخير: ${permissionTypes['إذن تأخير']}\n\n`;

    
    response += `أي نوع من الأذونات ترغب بطلبه؟`;

        return response;

}else if (lowerCaseMessage.includes('بديل')) {
          conversationContext.currentTopic = 'substitute';
        return 'يمكنك إضافة بديل بالضغط على اليوم في التقويم ثم اختيار "إضافة بديل". من تريد تعيينه كبديل؟';
} else if (lowerCaseMessage.includes('عطلات') || lowerCaseMessage.includes('اجازات رسمية')) {
        return 'العطلات الرسمية تشمل:\n1. عيد الفطر\n2. عيد الأضحى\n3. رأس السنة الهجرية\n4. عيد الميلاد المجيد\n5. ثورة 23 يوليو\n6. عيد العمال\n7. شم النسيم';
}else if (lowerCaseMessage.includes("ما هو تطبيق تقويم العاملين")) {
        return "تطبيق تقويم العاملين هو أداة لإدارة التقويم الخاص بالعاملين، ويتضمن ميزات مثل إدارة الإجازات، حساب الرصيد الكلي والمتبقي، وتخصيص أيام العمل والعطلات الرسمية.";

}else if (lowerCaseMessage.includes("كيف يمكنني إدارة الإجازات في التطبيق")) {
        return "يمكنك إدارة الإجازات عن طريق إضافة أنواع مختلفة من الإجازات مثل العارضة أو الاعتيادية، مع مراعاة القيود الشهرية والسنوية المحددة.";
}else if (lowerCaseMessage.includes("ما هي قيود الإجازات في التطبيق")) {
        return "القيود تشمل: إجازات سنوية اعتيادية بحد أقصى 6 أيام، إجازات اعتيادية بحد سنوي 30 يومًا، إجازات عارضة بحد سنوي 7 أيام، وإجمالي إجازات شهرية بحد أقصى 4 أيام.";
}else if (lowerCaseMessage.includes("كيف يمكنني إضافة بديل في التطبيق")) {
        return "يمكنك إضافة بديل عن طريق إدخال اسم البديل ليوم محدد، وعرض أو حذف البدلاء من القائمة المخزنة.";
}else if (lowerCaseMessage.includes("ما هي ميزات الفلاتر في التطبيق")) {
        return "الفلاتر تتيح لك تغيير عرض التقويم بناءً على الشهر، السنة، أو الوردية، مما يعيد بناء التقويم لعرض البيانات المطلوبة.";
}else if (lowerCaseMessage.includes("هل يوفر التطبيق إشعارات")) {
        return "نعم، التطبيق يوفر إشعارات تظهر عند حفظ أو حذف البيانات.";
 }else if (lowerCaseMessage.includes("ما هي المعلومات الموجودة في ملف المستخدم الشخصي")) {
        return "ملف المستخدم الشخصي يحتوي على اسم الموظف ورقم الكود الوظيفي.";
}else if (lowerCaseMessage.includes("كيف يمكنني إنشاء تقويم جديد")) {
        return "يمكنك إنشاء تقويم جديد عن طريق تحديد السنة والشهر والوردية المطلوبة، وسيقوم التطبيق بإنشاء التقويم تلقائيًا.";
}else if (lowerCaseMessage.includes("كيف يتم تمييز العطلات الرسمية")) {
        return "يتم تمييز العطلات الرسمية في التقويم بألوان أو رموز خاصة لتسهيل التعرف عليها.";
}else if (lowerCaseMessage.includes("كيف يمكنني حساب رصيد الإجازات المتبقي")) {
        return "يمكنك عرض رصيد الإجازات المتبقي من خلال قسم الإجازات في التطبيق، حيث يعرض الرصيد الكلي والمتبقي لك.";
}else if (lowerCaseMessage.includes("هل يمكنني تعديل الإجازات بعد إضافتها")) {
        return "نعم، يمكنك تعديل الإجازات أو حذفها من خلال قسم إدارة الإجازات في التطبيق.";
}else if (lowerCaseMessage.includes("كيف يمكنني تغيير الوردية")) {
        return "يمكنك تغيير الوردية من خلال إعدادات التقويم، حيث يمكنك تحديد الوردية المفضلة وسيتم تحديث التقويم تلقائيًا.";
}else if (lowerCaseMessage.includes("هل يدعم التطبيق أكثر من لغة")) {
        return "حاليًا، التطبيق يدعم اللغة العربية فقط، ولكن يمكن إضافة لغات أخرى في التحديثات القادمة.";
}else if (lowerCaseMessage.includes("كيف يمكنني مشاركة التقويم مع زملائي")) {
        return "يمكنك مشاركة التقويم من خلال تصديره كملف أو إرسال رابط خاص عبر التطبيق.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة عطلة رسمية جديدة")) {
        return "نعم، يمكنك إضافة عطلة رسمية جديدة من خلال قسم إدارة العطلات في التطبيق.";
}else if (lowerCaseMessage.includes("ما هي أنواع الورديات المتاحة")) {
        return "الورديات المتاحة تشمل الوردية الصباحية، المسائية، والليلية. يمكنك تخصيصها حسب احتياجاتك.";
}else if (lowerCaseMessage.includes("كيف يمكنني الاتصال بالدعم الفني")) {
        return "يمكنك الاتصال بالدعم الفني من خلال قسم المساعدة في التطبيق أو عن طريق إرسال بريد إلكتروني إلى support@example.com.";
}else if (lowerCaseMessage.includes("هل يمكنني استخدام التطبيق بدون إنترنت")) {
        return "نعم، يمكنك استخدام التطبيق بدون إنترنت، ولكن بعض الميزات مثل التحديثات التلقائية ومشاركة البيانات تتطلب اتصالاً بالإنترنت.";
}else if (lowerCaseMessage.includes("كيف يمكنني تحديث بياناتي الشخصية")) {
        return "يمكنك تحديث بياناتك الشخصية من خلال ملفك الشخصي في التطبيق، حيث يمكنك تعديل الاسم ورقم الكود الوظيفي.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة أكثر من بديل ليوم واحد")) {
        return "لا، يمكنك إضافة بديل واحد فقط لكل يوم في التقويم.";
}else if (lowerCaseMessage.includes("كيف يمكنني حذف بديل")) {
        return "يمكنك حذف البديل من خلال قائمة البدلاء في التطبيق، حيث يمكنك تحديد البديل وحذفه بسهولة.";
}else if (lowerCaseMessage.includes("ما هي الميزات الجديدة في التطبيق")) {
        return "تشمل الميزات الجديدة تحسينات في واجهة المستخدم، إضافة فلاتر متقدمة، ودعم للإشعارات الفورية.";

}else if (lowerCaseMessage.includes("من انت")) {
    return "أنا الأسطورة، هنا لمساعدتك في أي استفسارات لديك قدر المستطاع.";
}else if (lowerCaseMessage.includes("ماذا تعرف عن التطبيق")) {
    return "التطبيق يساعدك على تنظيم وقتك وإدارة مهامك بشكل أفضل. يمكنك مشاركته مع زملائك!";
}else if (lowerCaseMessage.includes("ما هو اسمك")) {
    return "أنا الأسطورة،  ولكن يمكنك مناداتي بأي اسم تريده!";
}else if (lowerCaseMessage.includes("ما اسمك")) {
    return "أنا الأسطورة،  ولكن يمكنك مناداتي بأي اسم تريده!";
}else if (lowerCaseMessage.includes("اسمك اي")) {
    return "أنا الأسطورة،  ولكن يمكنك مناداتي بأي اسم تريده!";
}else if (lowerCaseMessage.includes("انتا مين")) {
    return "أنا الأسطورة،  ولكن يمكنك مناداتي بأي اسم تريده!";
}else if (lowerCaseMessage.includes("من هو المطور")) {
    return "بالطبع مصطفى الأسطورة  المطور والمبرمج والمصمم لهذا التطبيق ";

}else if (lowerCaseMessage.includes("ما هو تطبيق تقويم العاملين")) {
        return "تطبيق تقويم العاملين هو أداة لإدارة التقويم الخاص بالعاملين، ويتضمن ميزات مثل إدارة الإجازات، حساب الرصيد الكلي والمتبقي، وتخصيص أيام العمل والعطلات الرسمية.";
}else if (lowerCaseMessage.includes("كيف يمكنني إدارة الإجازات في التطبيق")) {
        return "يمكنك إدارة الإجازات عن طريق إضافة أنواع مختلفة من الإجازات مثل العارضة أو الاعتيادية، مع مراعاة القيود الشهرية والسنوية المحددة.";
}else if (lowerCaseMessage.includes("ما هي قيود الإجازات في التطبيق")) {
        return "القيود تشمل: إجازات سنوية اعتيادية بحد أقصى 6 أيام، إجازات اعتيادية بحد سنوي 30 يومًا، إجازات عارضة بحد سنوي 7 أيام، وإجمالي إجازات شهرية بحد أقصى 4 أيام.";
}else if (lowerCaseMessage.includes("كيف يمكنني إضافة بديل في التطبيق")) {
        return "يمكنك إضافة بديل عن طريق إدخال اسم البديل ليوم محدد، وعرض أو حذف البدلاء من القائمة المخزنة.";
}else if (lowerCaseMessage.includes("ما هي ميزات الفلاتر في التطبيق")) {
        return "الفلاتر تتيح لك تغيير عرض التقويم بناءً على الشهر، السنة، أو الوردية، مما يعيد بناء التقويم لعرض البيانات المطلوبة.";
}else if (lowerCaseMessage.includes("هل يوفر التطبيق إشعارات")) {
        return "نعم، التطبيق يوفر إشعارات تظهر عند حفظ أو حذف البيانات.";
 }else if (lowerCaseMessage.includes("ما هي المعلومات الموجودة في ملف المستخدم الشخصي")) {
        return "ملف المستخدم الشخصي يحتوي على اسم الموظف ورقم الكود الوظيفي.";
}else if (lowerCaseMessage.includes("كيف يمكنني إنشاء تقويم جديد")) {
        return "يمكنك إنشاء تقويم جديد عن طريق تحديد السنة والشهر والوردية المطلوبة، وسيقوم التطبيق بإنشاء التقويم تلقائيًا.";
}else if (lowerCaseMessage.includes("كيف يتم تمييز العطلات الرسمية")) {
        return "يتم تمييز العطلات الرسمية في التقويم بألوان أو رموز خاصة لتسهيل التعرف عليها.";
}else if (lowerCaseMessage.includes("كيف يمكنني حساب رصيد الإجازات المتبقي")) {
        return "يمكنك عرض رصيد الإجازات المتبقي من خلال قسم الإجازات في التطبيق، حيث يعرض الرصيد الكلي والمتبقي لك.";
}else if (lowerCaseMessage.includes("هل يمكنني تعديل الإجازات بعد إضافتها")) {
        return "نعم، يمكنك تعديل الإجازات أو حذفها من خلال قسم إدارة الإجازات في التطبيق.";
}else if (lowerCaseMessage.includes("كيف يمكنني تغيير الوردية")) {
        return "يمكنك تغيير الوردية من خلال إعدادات التقويم، حيث يمكنك تحديد الوردية المفضلة وسيتم تحديث التقويم تلقائيًا.";
}else if (lowerCaseMessage.includes("هل يدعم التطبيق أكثر من لغة")) {
        return "حاليًا، التطبيق يدعم اللغة العربية فقط، ولكن يمكن إضافة لغات أخرى في التحديثات القادمة.";
}else if (lowerCaseMessage.includes("كيف يمكنني مشاركة التقويم مع زملائي")) {
        return "يمكنك مشاركة التقويم من خلال تصديره كملف أو إرسال رابط خاص عبر التطبيق.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة عطلة رسمية جديدة")) {
        return "نعم، يمكنك إضافة عطلة رسمية جديدة من خلال قسم إدارة العطلات في التطبيق.";
}else if (lowerCaseMessage.includes("ما هي أنواع الورديات المتاحة")) {
        return "الورديات المتاحة تشمل الوردية الصباحية، المسائية، والليلية. يمكنك تخصيصها حسب احتياجاتك.";
}else if (lowerCaseMessage.includes("كيف يمكنني الاتصال بالدعم الفني")) {
        return "يمكنك الاتصال بالدعم الفني من خلال قسم المساعدة في التطبيق أو عن طريق إرسال بريد إلكتروني إلى support@example.com.";
}else if (lowerCaseMessage.includes("هل يمكنني استخدام التطبيق بدون إنترنت")) {
        return "نعم، يمكنك استخدام التطبيق بدون إنترنت، ولكن بعض الميزات مثل التحديثات التلقائية ومشاركة البيانات تتطلب اتصالاً بالإنترنت.";
}else if (lowerCaseMessage.includes("كيف يمكنني تحديث بياناتي الشخصية")) {
        return "يمكنك تحديث بياناتك الشخصية من خلال ملفك الشخصي في التطبيق، حيث يمكنك تعديل الاسم ورقم الكود الوظيفي.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة أكثر من بديل ليوم واحد")) {
        return "لا، يمكنك إضافة بديل واحد فقط لكل يوم في التقويم.";
}else if (lowerCaseMessage.includes("كيف يمكنني حذف بديل")) {
        return "يمكنك حذف البديل من خلال قائمة البدلاء في التطبيق، حيث يمكنك تحديد البديل وحذفه بسهولة.";
}else if (lowerCaseMessage.includes("ما هي الميزات الجديدة في التطبيق")) {
        return "تشمل الميزات الجديدة تحسينات في واجهة المستخدم، إضافة فلاتر متقدمة، ودعم للإشعارات الفورية.";

   }else if (lowerCaseMessage.includes("كيف يمكنني إضافة إجازة")) {
     return "يمكنك إضافة إجازة بالضغط على اليوم المطلوب في التقويم، ثم اختيار نوع الإجازة من القائمة المنبثقة.";
}else if (lowerCaseMessage.includes("كيف يمكنني إضافة إذن")) {
    return "يمكنك إضافة إذن بالضغط على اليوم المطلوب في التقويم، ثم اختيار نوع الإذن من القائمة المنبثقة.";
}else if (lowerCaseMessage.includes("كيف يمكنني إلغاء إجازة")) {
    return "يمكنك إلغاء الإجازة بالضغط على اليوم الذي تمت إضافة الإجازة له، ثم اختيار 'إلغاء الإجازة' من القائمة.";
}else if (lowerCaseMessage.includes("كيف يمكنني إلغاء إذن")) {
    return "يمكنك إلغاء الإذن بالضغط على اليوم الذي تمت إضافة الإذن له، ثم اختيار 'إلغاء الإذن' من القائمة.";
}else if (lowerCaseMessage.includes("ما هي أنواع الإجازات المتاحة")) {
    return "أنواع الإجازات المتاحة هي: إجازة عارضة، إجازة اعتيادية، إجازة سنوية، إجازة راحة، وإجازة مرضية.";
}else if (lowerCaseMessage.includes("ما هي أنواع الأذونات المتاحة")) {
    return "أنواع الأذونات المتاحة هي: إذن شخصي، إذن مصلحي، إذن تأخير، إذن طبي، ومأمورية.";
}else if (lowerCaseMessage.includes("كيف يمكنني إضافة بديل")) {
    return "يمكنك إضافة بديل بالضغط على زر 'بدل' في النافذة المنبثقة، ثم إدخال اسم البديل.";
}else if (lowerCaseMessage.includes("كيف يمكنني عرض الأسماء التي تم البدل معهم")) {
    return "يمكنك عرض الأسماء التي تم البدل معهم بالضغط على زر 'الأسماء التي تم البدل معهم' في نافذة الإذن.";
}else if (lowerCaseMessage.includes("كيف يمكنني حذف بديل")) {
    return "يمكنك حذف البديل بالضغط على زر 'حذف' بجانب اسم البديل في قائمة الأسماء التي تم البدل معهم.";
}else if (lowerCaseMessage.includes("ما هي الحدود المسموحة للإجازات")) {
    return "الحدود المسموحة للإجازات هي: إجازات عارضة (7 أيام سنويًا)، إجازات اعتيادية (30 يومًا سنويًا)، وإجازات سنوية (6 أيام سنويًا).";
}else if (lowerCaseMessage.includes("ما هي الحدود المسموحة للأذونات")) {
    return "الحدود المسموحة للأذونات هي: إذن شخصي (3 مرات شهريًا)، إذن مصلحي (3 مرات شهريًا)، إذن تأخير (3 مرات شهريًا)، إذن طبي (3 مرات شهريًا)، ومأمورية (5 مرات شهريًا).";
}else if (lowerCaseMessage.includes("كيف يمكنني تغيير السنة في التقويم")) {
    return "يمكنك تغيير السنة من خلال القائمة المنسدلة 'اختر السنة' في أعلى الصفحة.";
}else if (lowerCaseMessage.includes("كيف يمكنني تغيير الشهر في التقويم")) {
    return "يمكنك تغيير الشهر من خلال القائمة المنسدلة 'فلتر بحث عن الشهر' في أعلى الصفحة.";
}else if (lowerCaseMessage.includes("كيف يمكنني تغيير الوردية في التقويم")) {
    return "يمكنك تغيير الوردية من خلال القائمة المنسدلة 'اختر الوردية التابع لها' في أعلى الصفحة.";
}else if (lowerCaseMessage.includes("كيف يمكنني عرض جميع الأشهر")) {
    return "يمكنك عرض جميع الأشهر عن طريق اختيار 'جميع الأشهر' من القائمة المنسدلة 'فلتر بحث عن الشهر'.";
}else if (lowerCaseMessage.includes("كيف يمكنني العودة إلى الأعلى")) {
    return "يمكنك العودة إلى أعلى الصفحة بالضغط على الزر العائم في الزاوية السفلية اليمنى من الشاشة.";
}else if (lowerCaseMessage.includes("ما هي العطلات الرسمية في التقويم")) {
    return "العطلات الرسمية تشمل: عيد الميلاد المجيد، عيد الفطر، عيد الأضحى، شم النسيم، تحرير سيناء، عيد العمال، رأس السنة الهجرية، ثورة 30 يونيو، عيد ثورة 23 يوليو، المولد النبوي، وعيد نصر أكتوبر.";
}else if (lowerCaseMessage.includes("كيف يمكنني معرفة أيام الراحة")) {
    return "أيام الراحة تظهر في التقويم بلون مختلف ويمكنك رؤيتها مباشرة عند اختيار الوردية المناسبة.";
}else if (lowerCaseMessage.includes("كيف يمكنني حفظ التغييرات")) {
    return "يتم حفظ التغييرات تلقائيًا عند إضافة أو إلغاء إجازة أو إذن.";
}else if (lowerCaseMessage.includes("كيف يمكنني تحميل الإجازات السابقة")) {
    return "يتم تحميل الإجازات السابقة تلقائيًا عند فتح التقويم، ويمكنك رؤيتها في الأيام المحددة.";
}else if (lowerCaseMessage.includes("كيف يمكنني الاتصال بالدعم")) {
    return "يمكنك الاتصال بالدعم من خلال إرسال بريد إلكتروني من القائمة الجانبية";

                 
}else if (lowerCaseMessage.includes("كيف يمكنني إضافة إجازة")) {
    return "يمكنك إضافة إجازة بالضغط على اليوم المطلوب في التقويم، ثم اختيار نوع الإجازة من القائمة المنبثقة.";
}else if (lowerCaseMessage.includes("كيف يمكنني إضافة إذن")) {
    return "يمكنك إضافة إذن بالضغط على اليوم المطلوب في التقويم، ثم اختيار نوع الإذن من القائمة المنبثقة.";
}else if (lowerCaseMessage.includes("كيف يمكنني إلغاء إجازة")) {
    return "يمكنك إلغاء الإجازة بالضغط على اليوم الذي تمت إضافة الإجازة له، ثم اختيار 'إلغاء الإجازة' من القائمة.";
}else if (lowerCaseMessage.includes("كيف يمكنني إلغاء إذن")) {
    return "يمكنك إلغاء الإذن بالضغط على اليوم الذي تمت إضافة الإذن له، ثم اختيار 'إلغاء الإذن' من القائمة.";
}else if (lowerCaseMessage.includes("ما هي أنواع الإجازات المتاحة")) {
    return "أنواع الإجازات المتاحة هي: إجازة عارضة، إجازة اعتيادية، إجازة سنوية، إجازة راحة، وإجازة مرضية.";
}else if (lowerCaseMessage.includes("ما هي أنواع الأذونات المتاحة")) {
    return "أنواع الأذونات المتاحة هي: إذن شخصي، إذن مصلحي، إذن تأخير، إذن طبي، ومأمورية.";
}else if (lowerCaseMessage.includes("كيف يمكنني إضافة بديل")) {
    return "يمكنك إضافة بديل بالضغط على زر 'بدل' في النافذة المنبثقة، ثم إدخال اسم البديل.";
}else if (lowerCaseMessage.includes("كيف يمكنني عرض الأسماء التي تم البدل معهم")) {
    return "يمكنك عرض الأسماء التي تم البدل معهم بالضغط على زر 'الأسماء التي تم البدل معهم' في نافذة الإذن.";
}else if (lowerCaseMessage.includes("كيف يمكنني حذف بديل")) {
    return "يمكنك حذف البديل بالضغط على زر 'حذف' بجانب اسم البديل في قائمة الأسماء التي تم البدل معهم.";
}else if (lowerCaseMessage.includes("ما هي الحدود المسموحة للإجازات")) {
    return "الحدود المسموحة للإجازات هي: إجازات عارضة (7 أيام سنويًا)، إجازات اعتيادية (30 يومًا سنويًا)، وإجازات سنوية (6 أيام سنويًا).";
}else if (lowerCaseMessage.includes("ما هي الحدود المسموحة للأذونات")) {
    return "الحدود المسموحة للأذونات هي: إذن شخصي (3 مرات شهريًا)، إذن مصلحي (3 مرات شهريًا)، إذن تأخير (3 مرات شهريًا)، إذن طبي (3 مرات شهريًا)، ومأمورية (5 مرات شهريًا).";
}else if (lowerCaseMessage.includes("كيف يمكنني تغيير السنة في التقويم")) {
    return "يمكنك تغيير السنة من خلال القائمة المنسدلة 'اختر السنة' في أعلى الصفحة.";
}else if (lowerCaseMessage.includes("كيف يمكنني تغيير الشهر في التقويم")) {
    return "يمكنك تغيير الشهر من خلال القائمة المنسدلة 'فلتر بحث عن الشهر' في أعلى الصفحة.";
}else if (lowerCaseMessage.includes("كيف يمكنني تغيير الوردية في التقويم")) {
    return "يمكنك تغيير الوردية من خلال القائمة المنسدلة 'اختر الوردية التابع لها' في أعلى الصفحة.";
}else if (lowerCaseMessage.includes("كيف يمكنني عرض جميع الأشهر")) {
    return "يمكنك عرض جميع الأشهر عن طريق اختيار 'جميع الأشهر' من القائمة المنسدلة 'فلتر بحث عن الشهر'.";
}else if (lowerCaseMessage.includes("كيف يمكنني العودة إلى الأعلى")) {
    return "يمكنك العودة إلى أعلى الصفحة بالضغط على الزر العائم في الزاوية السفلية اليمنى من الشاشة.";
}else if (lowerCaseMessage.includes("ما هي العطلات الرسمية في التقويم")) {
    return "العطلات الرسمية تشمل: عيد الميلاد المجيد، عيد الفطر، عيد الأضحى، شم النسيم، تحرير سيناء، عيد العمال، رأس السنة الهجرية، ثورة 30 يونيو، عيد ثورة 23 يوليو، المولد النبوي، وعيد نصر أكتوبر.";
}else if (lowerCaseMessage.includes("كيف يمكنني معرفة أيام الراحة")) {
    return "أيام الراحة تظهر في التقويم بلون مختلف ويمكنك رؤيتها مباشرة عند اختيار الوردية المناسبة.";
}else if (lowerCaseMessage.includes("كيف يمكنني حفظ التغييرات")) {
    return "يتم حفظ التغييرات تلقائيًا عند إضافة أو إلغاء إجازة أو إذن.";
}else if (lowerCaseMessage.includes("كيف يمكنني تحميل الإجازات السابقة")) {
    return "يتم تحميل الإجازات السابقة تلقائيًا عند فتح التقويم، ويمكنك رؤيتها في الأيام المحددة.";
}else if (lowerCaseMessage.includes("كيف يمكنني الاتصال بالدعم")) {
    return "يمكنك الاتصال بالدعم من خلال إرسال بريد إلكتروني إلى https://github.com/Alostoura-Official.";
}else if (
    lowerCaseMessage.includes("من هو مطور التطبيق") ||
    lowerCaseMessage.includes("من هو مصمم التطبيق") ||
    lowerCaseMessage.includes("من قام ببرمجة التطبيق") ||
    lowerCaseMessage.includes("من هو المبرمج الرئيسي للتطبيق")
) {
    return `
        <div style="text-align: center;">
            <p><strong>مصطفى الأسطورة</strong> هو المطور، المصمم، والمبرمج الرئيسي لهذا التطبيق 💻🚀</p>
            <img src="https://i.imgur.com/vWHpyQF.png" alt="صورة المطور" style="width: 120px; height: 120px; border-radius: 50%; margin-top: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.2);" />
        </div>
    `;
}else if (lowerCaseMessage.includes("هل يمكنني التواصل مع مطور التطبيق")) {
    return `
        <div style="text-align: center;">
            <p>نعم، يمكنك التواصل مع <strong>مصطفى الأسطورة</strong> عبر البريد الإلكتروني أو من خلال صفحة الدعم في التطبيق.</p>
            <img src="https://i.imgur.com/vWHpyQF.png" alt="صورة المطور" style="width: 100px; height: 100px; border-radius: 50%; margin-top: 10px;" />
        </div>
    `;
}else if (lowerCaseMessage.includes("ما هي خبرة مطور التطبيق")) {
    return `
        <div style="text-align: center;">
            <p>مصطفى الأسطورة لديه خبرة واسعة في تطوير التطبيقات، إدارة المشاريع التقنية، وتصميم واجهات المستخدم الحديثة.</p>
            <img src="https://i.imgur.com/vWHpyQF.png" alt="صورة المطور" style="width: 100px; height: 100px; border-radius: 50%; margin-top: 10px;" />
        </div>
    `;


}else if (lowerCaseMessage.includes("هل التطبيق مجاني")) {
    return "نعم، التطبيق مجاني للاستخدام، وقد تم تطويره بهدف تسهيل إدارة التقويم والإجازات.";
}else if (lowerCaseMessage.includes("هل يمكنني المساهمة في تطوير التطبيق")) {
    return "نعم، يمكنك المساهمة في تطوير التطبيق من خلال التواصل مع المطور مصطفى الأسطورة.";
}else if (lowerCaseMessage.includes("ما هي التقنيات المستخدمة في التطبيق")) {
    return "تم استخدام تقنيات مثل HTML, CSS, JavaScript في تطوير هذا التطبيق.";
}else if (lowerCaseMessage.includes("هل التطبيق مفتوح المصدر")) {
    return "حاليًا، التطبيق ليس مفتوح المصدر، ولكن يمكنك التواصل مع المطور للحصول على مزيد من التفاصيل.";
}else if (lowerCaseMessage.includes("ما هي الإصدارات المستقبلية للتطبيق")) {
    return "سيشمل التطبيق في الإصدارات المستقبلية ميزات جديدة مثل دعم اللغات الإضافية وتحسين واجهة المستخدم.";
}else if (lowerCaseMessage.includes("هل يمكنني اقتراح ميزات جديدة")) {
    return "بالطبع! يمكنك إرسال اقتراحاتك إلى المطور مصطفى الأسطورة عبر البريد الإلكتروني أو من خلال التطبيق.";
}else if (lowerCaseMessage.includes("ما هي أهداف التطبيق")) {
    return "الهدف الرئيسي من التطبيق هو تسهيل إدارة التقويم والإجازات للموظفين وتحسين تجربة المستخدم.";
}else if (lowerCaseMessage.includes("هل التطبيق متوافق مع الأجهزة المحمولة")) {
    return "نعم، التطبيق متوافق مع الأجهزة المحمولة ويتمتع بتصميم سريع الاستجابة.";
}else if (lowerCaseMessage.includes("هل التطبيق يدعم اللغات الأخرى")) {
    return "حاليًا، التطبيق يدعم اللغة العربية فقط، ولكن يمكن إضافة لغات أخرى في الإصدارات القادمة.";
}else if (lowerCaseMessage.includes("ما هي المدة التي استغرقها تطوير التطبيق")) {
    return "تم تطوير التطبيق على مدار عدة أشهر بواسطة مصطفى الأسطورة.";
}else if (lowerCaseMessage.includes("هل يمكنني الحصول على نسخة من الكود المصدري")) {
    return "حاليًا، الكود المصدري غير متاح للعامة، ولكن يمكنك التواصل مع المطور للحصول على مزيد من التفاصيل.";
}else if (lowerCaseMessage.includes("ما هي التحديات التي واجهت تطوير التطبيق")) {
    return "من أبرز التحديات كانت تحسين الأداء ودعم جميع المتصفحات والأجهزة المختلفة.";
}else if (lowerCaseMessage.includes("هل التطبيق آمن للاستخدام")) {
    return "نعم، التطبيق آمن للاستخدام، وقد تم تطويره باتباع أفضل ممارسات الأمان.";
}else if (lowerCaseMessage.includes("هل يمكنني استخدام التطبيق بدون إنترنت")) {
    return "نعم، يمكنك استخدام التطبيق بدون إنترنت، ولكن بعض الميزات مثل التحديثات التلقائية تتطلب اتصالاً بالإنترنت.";
}else if (lowerCaseMessage.includes("ما هي الخطط المستقبلية للتطبيق")) {
    return "تشمل الخطط المستقبلية إضافة ميزات جديدة مثل دعم اللغات الإضافية وتحسين تجربة المستخدم.";
}else if (lowerCaseMessage.includes("كيف يمكنني تغيير لون التقويم")) {
    return "حاليًا، لا يمكن تغيير لون التقويم، ولكن يمكن إضافة هذه الميزة في الإصدارات القادمة.";
}else if (lowerCaseMessage.includes("هل يمكنني تصدير التقويم")) {
    return "نعم، يمكنك تصدير التقويم كملف عن طريق الضغط على زر التصدير في القائمة.";
}else if (lowerCaseMessage.includes("هل يمكنني مشاركة التقويم مع الآخرين")) {
    return "نعم، يمكنك مشاركة التقويم مع الآخرين عن طريق إرسال رابط خاص عبر التطبيق.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة أكثر من بديل ليوم واحد")) {
    return "لا، يمكنك إضافة بديل واحد فقط لكل يوم في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إجازة لأكثر من يوم")) {
    return "نعم، يمكنك إضافة إجازة لأكثر من يوم عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إذن لأكثر من يوم")) {
    return "نعم، يمكنك إضافة إذن لأكثر من يوم عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إجازة لأيام متفرقة")) {
    return "نعم، يمكنك إضافة إجازة لأيام متفرقة عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إذن لأيام متفرقة")) {
    return "نعم، يمكنك إضافة إذن لأيام متفرقة عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إجازة لأيام متتالية")) {
    return "نعم، يمكنك إضافة إجازة لأيام متتالية عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إذن لأيام متتالية")) {
    return "نعم، يمكنك إضافة إذن لأيام متتالية عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إجازة لأيام غير متتالية")) {
    return "نعم، يمكنك إضافة إجازة لأيام غير متتالية عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إذن لأيام غير متتالية")) {
    return "نعم، يمكنك إضافة إذن لأيام غير متتالية عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إجازة لأيام محددة")) {
    return "نعم، يمكنك إضافة إجازة لأيام محددة عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إذن لأيام محددة")) {
    return "نعم، يمكنك إضافة إذن لأيام محددة عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إجازة لأيام عشوائية")) {
    return "نعم، يمكنك إضافة إجازة لأيام عشوائية عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إذن لأيام عشوائية")) {
    return "نعم، يمكنك إضافة إذن لأيام عشوائية عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إجازة لأيام محددة في الشهر")) {
    return "نعم، يمكنك إضافة إجازة لأيام محددة في الشهر عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إذن لأيام محددة في الشهر")) {
    return "نعم، يمكنك إضافة إذن لأيام محددة في الشهر عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إجازة لأيام محددة في السنة")) {
    return "نعم، يمكنك إضافة إجازة لأيام محددة في السنة عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إذن لأيام محددة في السنة")) {
    return "نعم، يمكنك إضافة إذن لأيام محددة في السنة عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إجازة لأيام محددة في الوردية")) {
    return "نعم، يمكنك إضافة إجازة لأيام محددة في الوردية عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إذن لأيام محددة في الوردية")) {
    return "نعم، يمكنك إضافة إذن لأيام محددة في الوردية عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إجازة لأيام محددة في الشهر والوردية")) {
    return "نعم، يمكنك إضافة إجازة لأيام محددة في الشهر والوردية عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إذن لأيام محددة في الشهر والوردية")) {
    return "نعم، يمكنك إضافة إذن لأيام محددة في الشهر والوردية عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إجازة لأيام محددة في السنة والوردية")) {
    return "نعم، يمكنك إضافة إجازة لأيام محددة في السنة والوردية عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إذن لأيام محددة في السنة والوردية")) {
    return "نعم، يمكنك إضافة إذن لأيام محددة في السنة والوردية عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إجازة لأيام محددة في الشهر والسنة")) {
    return "نعم، يمكنك إضافة إجازة لأيام محددة في الشهر والسنة عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إذن لأيام محددة في الشهر والسنة")) {
    return "نعم، يمكنك إضافة إذن لأيام محددة في الشهر والسنة عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إجازة لأيام محددة في الشهر والسنة والوردية")) {
    return "نعم، يمكنك إضافة إجازة لأيام محددة في الشهر والسنة والوردية عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إذن لأيام محددة في الشهر والسنة والوردية")) {
    return "نعم، يمكنك إضافة إذن لأيام محددة في الشهر والسنة والوردية عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات")) {
    return "نعم، يمكنك إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات")) {
    return "نعم، يمكنك إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات")) {
    return "نعم، يمكنك إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات")) {
    return "نعم، يمكنك إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات")) {
    return "نعم، يمكنك إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات")) {
    return "نعم، يمكنك إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات")) {
    return "نعم، يمكنك إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات")) {
    return "نعم، يمكنك إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء")) {
    return "نعم، يمكنك إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء")) {
    return "نعم، يمكنك إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر")) {
    return "نعم، يمكنك إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر")) {
    return "نعم، يمكنك إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات")) {
    return "نعم، يمكنك إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات")) {
    return "نعم، يمكنك إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي")) {
    return "نعم، يمكنك إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي")) {
    return "نعم، يمكنك إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم")) {
    return "نعم، يمكنك إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم")) {
    return "نعم، يمكنك إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة")) {
    return "نعم، يمكنك إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة")) {
    return "نعم، يمكنك إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة")) {
    return "نعم، يمكنك إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة")) {
    return "نعم، يمكنك إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين")) {
    return "نعم، يمكنك إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين")) {
    return "نعم، يمكنك إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة")) {
    return "نعم، يمكنك إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة")) {
    return "نعم، يمكنك إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة والإشعارات السابقة")) {
    return "نعم، يمكنك إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة والإشعارات السابقة عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة والإشعارات السابقة")) {
    return "نعم، يمكنك إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة والإشعارات السابقة عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة والإشعارات السابقة والملف الشخصي السابق")) {
    return "نعم، يمكنك إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة والإشعارات السابقة والملف الشخصي السابق عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة والإشعارات السابقة والملف الشخصي السابق")) {
    return "نعم، يمكنك إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة والإشعارات السابقة والملف الشخصي السابق عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة والإشعارات السابقة والملف الشخصي السابق والتقويم السابق")) {
    return "نعم، يمكنك إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة والإشعارات السابقة والملف الشخصي السابق والتقويم السابق عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة والإشعارات السابقة والملف الشخصي السابق والتقويم السابق")) {
    return "نعم، يمكنك إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة والإشعارات السابقة والملف الشخصي السابق والتقويم السابق عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة والإشعارات السابقة والملف الشخصي السابق والتقويم السابق والإجازات السابقة السابقة")) {
    return "نعم، يمكنك إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة والإشعارات السابقة والملف الشخصي السابق والتقويم السابق والإجازات السابقة السابقة عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة والإشعارات السابقة والملف الشخصي السابق والتقويم السابق والإجازات السابقة السابقة")) {
    return "نعم، يمكنك إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة والإشعارات السابقة والملف الشخصي السابق والتقويم السابق والإجازات السابقة السابقة عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة والإشعارات السابقة والملف الشخصي السابق والتقويم السابق والإجازات السابقة السابقة والأذونات السابقة السابقة")) {
    return "نعم، يمكنك إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة والإشعارات السابقة والملف الشخصي السابق والتقويم السابق والإجازات السابقة السابقة والأذونات السابقة السابقة عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة والإشعارات السابقة والملف الشخصي السابق والتقويم السابق والإجازات السابقة السابقة والأذونات السابقة السابقة")) {
    return "نعم، يمكنك إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة والإشعارات السابقة والملف الشخصي السابق والتقويم السابق والإجازات السابقة السابقة والأذونات السابقة السابقة عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة والإشعارات السابقة والملف الشخصي السابق والتقويم السابق والإجازات السابقة السابقة والأذونات السابقة السابقة والبدلاء السابقين السابقين")) {
    return "نعم، يمكنك إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة والإشعارات السابقة والملف الشخصي السابق والتقويم السابق والإجازات السابقة السابقة والأذونات السابقة السابقة والبدلاء السابقين السابقين عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة والإشعارات السابقة والملف الشخصي السابق والتقويم السابق والإجازات السابقة السابقة والأذونات السابقة السابقة والبدلاء السابقين السابقين")) {
    return "نعم، يمكنك إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة والإشعارات السابقة والملف الشخصي السابق والتقويم السابق والإجازات السابقة السابقة والأذونات السابقة السابقة والبدلاء السابقين السابقين عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة والإشعارات السابقة والملف الشخصي السابق والتقويم السابق والإجازات السابقة السابقة والأذونات السابقة السابقة والبدلاء السابقين السابقين والفلاتر السابقة السابقة")) {
    return "نعم، يمكنك إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة والإشعارات السابقة والملف الشخصي السابق والتقويم السابق والإجازات السابقة السابقة والأذونات السابقة السابقة والبدلاء السابقين السابقين والفلاتر السابقة السابقة عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة والإشعارات السابقة والملف الشخصي السابق والتقويم السابق والإجازات السابقة السابقة والأذونات السابقة السابقة والبدلاء السابقين السابقين والفلاتر السابقة السابقة")) {
    return "نعم، يمكنك إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة والإشعارات السابقة والملف الشخصي السابق والتقويم السابق والإجازات السابقة السابقة والأذونات السابقة السابقة والبدلاء السابقين السابقين والفلاتر السابقة السابقة عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة والإشعارات السابقة والملف الشخصي السابق والتقويم السابق والإجازات السابقة السابقة والأذونات السابقة السابقة والبدلاء السابقين السابقين والفلاتر السابقة السابقة والإشعارات السابقة السابقة")) {
    return "نعم، يمكنك إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة والإشعارات السابقة والملف الشخصي السابق والتقويم السابق والإجازات السابقة السابقة والأذونات السابقة السابقة والبدلاء السابقين السابقين والفلاتر السابقة السابقة والإشعارات السابقة السابقة عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة والإشعارات السابقة والملف الشخصي السابق والتقويم السابق والإجازات السابقة السابقة والأذونات السابقة السابقة والبدلاء السابقين السابقين والفلاتر السابقة السابقة والإشعارات السابقة السابقة")) {
    return "نعم، يمكنك إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة والإشعارات السابقة والملف الشخصي السابق والتقويم السابق والإجازات السابقة السابقة والأذونات السابقة السابقة والبدلاء السابقين السابقين والفلاتر السابقة السابقة والإشعارات السابقة السابقة عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة والإشعارات السابقة والملف الشخصي السابق والتقويم السابق والإجازات السابقة السابقة والأذونات السابقة السابقة والبدلاء السابقين السابقين والفلاتر السابقة السابقة والإشعارات السابقة السابقة والملف الشخصي السابق السابق")) {
    return "نعم، يمكنك إضافة إجازة لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة والإشعارات السابقة والملف الشخصي السابق والتقويم السابق والإجازات السابقة السابقة والأذونات السابقة السابقة والبدلاء السابقين السابقين والفلاتر السابقة السابقة والإشعارات السابقة السابقة والملف الشخصي السابق السابق عن طريق تحديد الأيام المطلوبة في التقويم.";
}else if (lowerCaseMessage.includes("هل يمكنني إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة والإشعارات السابقة والملف الشخصي السابق والتقويم السابق والإجازات السابقة السابقة والأذونات السابقة السابقة والبدلاء السابقين السابقين والفلاتر السابقة السابقة والإشعارات السابقة السابقة والملف الشخصي السابق السابق")) {
    return "نعم، يمكنك إضافة إذن لأيام محددة في الشهر والسنة والوردية والعطلات والراحات والإجازات والأذونات والبدلاء والفلاتر والإشعارات والملف الشخصي والتقويم والإجازات السابقة والأذونات السابقة والبدلاء السابقين والفلاتر السابقة والإشعارات السابقة والملف الشخصي السابق والتقويم السابق والإجازات السابقة السابقة والأذونات السابقة السابقة والبدلاء السابقين السابقين والفلاتر السابقة السابقة والإشعارات السابقة السابقة والملف الشخصي السابق السابق عن طريق تحديد الأيام المطلوبة في التقويم.";


// 1. الأسئلة عن تثبيت التطبيق والأمان
} else if (lowerCaseMessage.includes("كيفية تثبيت التطبيق") || 
         lowerCaseMessage.includes("كيفية تنزيل التطبيق") ||
         lowerCaseMessage.includes("كيفية تثبت التطبيق")) {
    return `لتحميل التطبيق:
1. انتقل إلى إعدادات جهازك
2. تفعيل خيار "التثبيت من مصادر غير معروفة"
3. تحميل ملف APK من المصدر الموثوق
4. اتبع خطوات التثبيت

ملاحظة: عند التثبيت من خارج متجر جوجل، قد تظهر رسالة تحذيرية تقول "هذا التطبيق قد يكون ضاراً". هذا التحذير طبيعي لأن التطبيق ليس على متجر جوجل، لكنه آمن تماماً للاستخدام.`;

} else if (lowerCaseMessage.includes("كيفية مشاركة التطبيق") || 
         lowerCaseMessage.includes("كيف أشارك التطبيق")) {
    return `لمشاركة التطبيق مع الآخرين:
1. افتح قائمة الإعدادات في التطبيق
2. اختر "مشاركة التطبيق"
3. سيتم إنشاء رابط تحميل مباشر
4. أرسل هذا الرابط للأشخاص الذين تريد مشاركة التطبيق معهم`;

} else if (lowerCaseMessage.includes("هل التطبيق ضار بالجهاز") || 
         lowerCaseMessage.includes("هل التطبيق آمن") ||
         lowerCaseMessage.includes("هل فيه فيروسات")) {
    return `التطبيق آمن 100% ولا يحتوي على أي برمجيات خبيثة. التحذير الذي يظهر عند التثبيت (خاصة عند التثبيت من خارج متجر جوجل) هو إجراء وقائي معتاد. 

نؤكد أن التطبيق:
✓ لا يجمع أي بيانات شخصية
✓ لا يحتوي على فيروسات
✓ لا يؤثر على أداء الجهاز
✓ تم اختباره بواسطة برامج مكافحة الفيروسات`;

// 2. أسئلة جديدة عن ميزات التطبيق
} else if (lowerCaseMessage.includes("هل يوجد نسخة ويب") || 
         lowerCaseMessage.includes("هل يعمل على الكمبيوتر")) {
    return `حالياً التطبيق متاح فقط على أجهزة الأندرويد، لكننا نعمل على إصدار:
- نسخة ويب خلال الأشهر القادمة
- نسخة خاصة بأجهزة الكمبيوتر`;

} else if (lowerCaseMessage.includes("كيفية النسخ الاحتياطي") || 
         lowerCaseMessage.includes("كيف احفظ بياناتي")) {
    return `لعمل نسخة احتياطية من بياناتك:
1. انتقل إلى الإعدادات
2. اختر "النسخ الاحتياطي"
3. اختر مكان الحفظ (التخزين السحابي أو الذاكرة الداخلية)
4. اضغط على "إنشاء نسخة"

يمكنك استعادة البيانات لاحقاً من نفس القائمة`;

// 3. أسئلة دعم فني
} else if (lowerCaseMessage.includes("كيف أبلغ عن مشكلة") || 
         lowerCaseMessage.includes("كيف اتصل بالدعم")) {
    return `للتواصل مع الدعم الفني:
1. عبر البريد الإلكتروني: ostorainegypt@gmail.com
2. عبر الواتساب: الدعم الفني من القائمة الجانبية
3. من خلال نموذج التواصل من القائمة الجانبية

ملحوظة . ساعات العمل: متاح 24 ساعة`;

// 4. أسئلة التحديثات
} else if (lowerCaseMessage.includes("كيف احصل على التحديثات") || 
         lowerCaseMessage.includes("هل التطبيق محدث")) {
    return `سيصلك إشعار عند وجود تحديث جديد. يمكنك أيضاً:
1. تفعيل التحديث التلقائي من إعدادات التطبيق
2. التحقق يدوياً من خلال زيارة صفحة التطبيق

آخر إصدار: 2.3.1 (تم إصداره في 15/8/2023)`;

// 5. أسئلة الخصوصية
} else if (lowerCaseMessage.includes("هل التطبيق يخزن بياناتي") || 
         lowerCaseMessage.includes("سياسة الخصوصية")) {
    return `نحن نحرص على خصوصيتك:
- البيانات تخزن فقط على جهازك
- لا نصل إلى أي معلومات شخصية
- يمكنك حذف جميع البيانات من إعدادات التطبيق
- لقراءة سياسة الخصوصية كاملة، انتقل إلى قسم "عن التطبيق"`;



    // 2. الأسئلة عن المطور
    } else if (lowerCaseMessage.includes("من هو المطور") || 
           lowerCaseMessage.includes("من هو مصمم التطبيق") || 
           lowerCaseMessage.includes("من قام ببرمجة التطبيق")) {
    return `
        <div style="text-align: center;">
            <p>بالطبع، <strong>مصطفى الأسطورة</strong> هو المطور والمبرمج والمصمم لهذا التطبيق 💻✨</p>
            <img src="https://i.imgur.com/vWHpyQF.png" alt="صورة المطور مصطفى" style="width: 100px; height: 100px; border-radius: 50%; margin-top: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.2);" />
        </div>
    `;
    

    // 3. الأسئلة الشخصية عن البوت
    } else if (lowerCaseMessage.includes("من انت") || 
             lowerCaseMessage.includes("انتا مين") || 
             lowerCaseMessage.includes("ما هو اسمك")) {
        return "أنا الأسطورة، هنا لمساعدتك في أي استفسارات لديك";
    

    // 4. إدارة الإجازات
    } else if (lowerCaseMessage.includes('إجازة') || lowerCaseMessage.includes('اجازة')) {
        conversationContext.currentTopic = 'vacation';
        return 'حسناً، لدينا عدة أنواع من الإجازات:\n1. إجازة عارضة (7 أيام سنوياً)\n2. إجازة اعتيادية (30 يوم سنوياً)\nأي نوع تريد طلبه؟';
    
    } else if (lowerCaseMessage.includes('عارضة')) {
        conversationContext.pendingAction = 'request_emergency_leave';
        return 'كم يوم تريد أخذ إجازة عارضة؟ لديك ' + conversationContext.userData.remainingEmergency + ' أيام متبقية هذا العام.';
    
    } else if (lowerCaseMessage.includes('اعتيادية')) {
        conversationContext.pendingAction = 'request_regular_leave';
        return 'كم يوم تريد أخذ إجازة اعتيادية؟ لديك ' + conversationContext.userData.remainingVacation + ' أيام متبقية هذا العام.';
    
    } else if (lowerCaseMessage.includes('باقي') && lowerCaseMessage.includes('إجازة')) {
        return `حالياً لديك:\n- ${conversationContext.userData.remainingVacation} يوم إجازة اعتيادية\n- ${conversationContext.userData.remainingEmergency} يوم إجازة عارضة\n- ${3 - conversationContext.userData.usedPermissions} إذن متبقي هذا الشهر`;
    

    // 5. إدارة الأذونات
    } else if (lowerCaseMessage.includes('اذن') || lowerCaseMessage.includes('إذن')) {
        conversationContext.currentTopic = 'permissions';
        return 'نظام الأذونات يسمح بـ 3 أذونات شخصية و3 مصلحية و3 تأخير شهرياً. لديك ' + (3 - conversationContext.userData.usedPermissions) + ' أذونات متبقية هذا الشهر. أي نوع تريد؟';
    

    // 6. نظام البدلاء
    } else if (lowerCaseMessage.includes('بديل')) {
        conversationContext.currentTopic = 'substitute';
        return 'يمكنك إضافة بديل بالضغط على اليوم في التقويم ثم اختيار "إضافة بديل". من تريد تعيينه كبديل؟';
    

    // 7. العطلات الرسمية
    } else if (lowerCaseMessage.includes('عطلات') || lowerCaseMessage.includes('اجازات رسمية')) {
        return 'العطلات الرسمية تشمل:\n1. عيد الفطر\n2. عيد الأضحى\n3. رأس السنة الهجرية\n4. عيد الميلاد المجيد\n5. ثورة 23 يوليو\n6. عيد العمال\n7. شم النسيم';
    

    // 8. معلومات عامة عن التطبيق
    } else if (lowerCaseMessage.includes("ما هو تطبيق تقويم العاملين")) {
        return "تطبيق تقويم العاملين هو أداة لإدارة التقويم الخاص بالعاملين، ويتضمن ميزات مثل إدارة الإجازات، حساب الرصيد الكلي والمتبقي، وتخصيص أيام العمل والعطلات الرسمية.";
    
    } else if (lowerCaseMessage.includes("كيف يمكنني إدارة الإجازات في التطبيق")) {
        return "يمكنك إدارة الإجازات عن طريق إضافة أنواع مختلفة من الإجازات مثل العارضة أو الاعتيادية، مع مراعاة القيود الشهرية والسنوية المحددة.";
    
    // ... باقي أسئلة معلومات التطبيق

    // 9. إجراءات التطبيق
    } else if (lowerCaseMessage.includes("كيف يمكنني إضافة إجازة")) {
        return "يمكنك إضافة إجازة بالضغط على اليوم المطلوب في التقويم، ثم اختيار نوع الإجازة من القائمة المنبثقة.";
    
    } else if (lowerCaseMessage.includes("كيف يمكنني إضافة إذن")) {
        return "يمكنك إضافة إذن بالضغط على اليوم المطلوب في التقويم، ثم اختيار نوع الإذن من القائمة المنبثقة.";



}else if (lowerCaseMessage.includes('جهات اتصال') || lowerCaseMessage.includes('زملائي')) {
        return `للعثور على جهات اتصال الزملاء:
        1. انتقل إلى "دليل الموظفين"
        2. يمكنك البحث بالاسم أو القسم
        3. اضغط على اسم الموظف لرؤية تفاصيل التواصل
        
        الخيارات المتاحة:
        - الإيميل الداخلي
        - رقم المكتب (إن وجد)
        - رقم الهاتف المحمول (إذا سمح بالظهور)`;
   
 }else if (lowerCaseMessage.includes('سياسات الشركة') || lowerCaseMessage.includes('لوائح')) {
        return `سياسات الشركة متاحة عبر:
        1. قسم "السياسات واللوائح" في التطبيق
        2. بوابة الموارد البشرية
        3. مستندات SharePoint الداخلية
        
        أهم السياسات:
        - سياسة الإجازات والغياب
        - سياسة الأجور والمكافآت
        - سياسة العمل عن بُعد
        - لائحة السلوك الوظيفي`;
    
}else if (lowerCaseMessage.includes('أدوات الفريق') || lowerCaseMessage.includes('أدوات العمل')) {
        return `الأدوات المتاحة لفريقك:
        1. تقويم الفريق - لمتابعة الاجتماعات
        2. أداة إدارة المهام - لمتابعة المشاريع
        3. منصة التواصل الداخلي
        4. نظام مشاركة الملفات
        
        للوصول: انتقل إلى "أدوات العمل" في القائمة الرئيسية.`;
   
}else if (lowerCaseMessage.includes('طلب إجازة') || lowerCaseMessage.includes('إجازة')) {
        return `لطلب إجازة:
        1. انتقل إلى "إدارة الإجازات"
        2. اختر نوع الإجازة (سنوية/عارضة/مرضية)
        3. حدد تاريخ البدء والانتهاء
        4. أرفق المستندات المطلوبة (إذا لزم الأمر)
        5. اضغط "إرسال الطلب"
        
        مدة المعالجة: 24-48 ساعة عمل.`;
    
}else if (lowerCaseMessage.includes('رصيد إجازات') || lowerCaseMessage.includes('باقي إجازات')) {
        const remainingVacation = 21; // يمكن استبدالها بقيمة ديناميكية
        const remainingEmergency = 7;
        return `رصيدك الحالي من الإجازات:
        - الإجازات السنوية: ${remainingVacation} يوم
        - الإجازات العارضة: ${remainingEmergency} يوم
        - الأذونات المستخدمة هذا الشهر: 2 من 3 ساعات`;
    
}else if (lowerCaseMessage.includes('عطلات رسمية') || lowerCaseMessage.includes('إجازات رسمية')) {
        return `العطلات الرسمية القادمة:
        1. عيد الفطر: 10-12 أبريل 2024
        2. عيد الأضحى: 17-19 يونيو 2024
        3. اليوم الوطني: 23 سبتمبر 2024
        
        يمكنك عرض التفاصيل الكاملة في "التقويم التنظيمي".`;
    
}else if (lowerCaseMessage.includes('مشكلة فنية') || lowerCaseMessage.includes('إبلاغ عن مشكلة')) {
        return `للإبلاغ عن مشكلة فنية:
        1. انتقل إلى "مركز المساعدة او سياسة الإستخدام"
        2. اختر "تقرير مشكلة"
        3. املأ النموذج بتفاصيل المشكلة
        4. أرفق لقطات الشاشة (إن أمكن)
        
        يمكنك أيضًا الاتصال بالدعم الفني على:         - هاتف: *******         - إيميل: ********`;
    
}else if (lowerCaseMessage.includes('ميزات التطبيق') || lowerCaseMessage.includes('وظائف التطبيق')) {
        return `أهم ميزات التطبيق:
        1. إدارة الإجازات والطلبات
        2. تقويم الفريق المشترك
        3. نظام إدارة المهام
        4. دليل الموظفين
        5. بوابة السياسات واللوائح
        6. نظام الإشعارات الذكية
        
        جرب قائمة "اكتشف الميزات" لمعرفة المزيد!`;




 }else {
    return "أنا هنا لمساعدتك. لم افهم سؤالك بشكل صحيح، هل يمكنك التوضيح أكتر !";
            }
        }

        // التعرف على الصوت
        function startSpeechRecognition() {
            const micBtn = document.getElementById('mic-btn');
            micBtn.innerHTML = '🎙️';
            micBtn.style.backgroundColor = '#27ae60';
            
            const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            recognition.lang = 'ar-EG';
            recognition.interimResults = false;
            
            recognition.onresult = function(event) {
                const transcript = event.results[0][0].transcript;
                document.getElementById('user-input').value = transcript;
                sendMessage();
            };
            
            recognition.onerror = function(event) {
                console.error('Speech recognition error', event.error);
                micBtn.innerHTML = '🎤';
                micBtn.style.backgroundColor = '';
            };
            
            recognition.onend = function() {
                micBtn.innerHTML = '🎤';
                micBtn.style.backgroundColor = '';
            };
            
            recognition.start();
        }
    
    window.onload = function () {
    // إذا كانت هناك محادثة محفوظة، أظهر زر الاستعادة
    if (localStorage.getItem('previousChat')) {
        document.getElementById('restore-btn').style.display = 'inline-block';
    }
};

function resetChat() {
    const chatBox = document.getElementById('chat-box');
    const currentChat = chatBox.innerHTML;

    // تأكيد الحذف
    const confirmDelete = confirm('هل أنت متأكد أنك تريد حذف المحادثة؟');
    if (!confirmDelete) return;

    // حفظ المحادثة القديمة
    localStorage.setItem('previousChat', currentChat);

    // إعادة تعيين المحادثة إلى الرسالة الترحيبية فقط
    chatBox.innerHTML = `
        <div class="message bot-message">
            مرحباً! أنا الأسطورة، مساعدك الذكي لإدارة تقويم العاملين. كيف يمكنني مساعدتك اليوم؟
        </div>
    `;

    // إظهار زر الاستعادة
    document.getElementById('restore-btn').style.display = 'inline-block';
}

function restoreChat() {
    const savedChat = localStorage.getItem('previousChat');
    if (savedChat) {
        document.getElementById('chat-box').innerHTML = savedChat;
        localStorage.removeItem('previousChat'); // حذف النسخة القديمة
        document.getElementById('restore-btn').style.display = 'none'; // إخفاء زر الاستعادة
    } else {
        alert("لا توجد محادثة محفوظة للاستعادة.");
    }
}

