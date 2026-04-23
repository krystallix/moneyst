import React, { useState, useEffect } from 'react';
import { Modal, View, Text, Pressable } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

interface CustomDatePickerProps {
    visible: boolean;
    date: Date;
    onClose: () => void;
    onSelect: (date: Date) => void;
    maximumDate?: Date;
}

export function CustomDatePicker({ visible, date, onClose, onSelect, maximumDate }: CustomDatePickerProps) {
    const [viewDate, setViewDate] = useState(new Date(date.getFullYear(), date.getMonth(), 1));

    // Reset viewDate when visible becomes true
    useEffect(() => {
        if (visible) {
            setViewDate(new Date(date.getFullYear(), date.getMonth(), 1));
        }
    }, [visible, date]);

    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const prevMonthDays = new Date(viewDate.getFullYear(), viewDate.getMonth(), 0).getDate();
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

    const days = [];
    
    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        days.push({
            date: new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, prevMonthDays - i),
            isCurrentMonth: false
        });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
        days.push({
            date: new Date(viewDate.getFullYear(), viewDate.getMonth(), i),
            isCurrentMonth: true
        });
    }
    
    // Next month days to complete 42 cells (6 rows)
    const remainingTo42 = 42 - days.length;
    for (let i = 1; i <= remainingTo42; i++) {
        days.push({
            date: new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, i),
            isCurrentMonth: false
        });
    }

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const maxDate = maximumDate ? new Date(maximumDate) : null;
    if (maxDate) maxDate.setHours(0, 0, 0, 0);

    return (
        <Modal visible={visible} transparent animationType="fade">
            <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }} onPress={onClose}>
                <Pressable style={{ backgroundColor: 'white', width: '85%', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } }} onPress={e => e.stopPropagation()}>
                    {/* Header */}
                    <View className="flex-row justify-between items-center mb-6">
                        <Pressable onPress={handlePrevMonth} className="p-2 active:opacity-50">
                            <ChevronLeft color="#111827" size={22} strokeWidth={2.5} />
                        </Pressable>
                        <Text className="text-[17px] font-bold text-foreground">
                            {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                        </Text>
                        <Pressable onPress={handleNextMonth} className="p-2 active:opacity-50">
                            <ChevronRight color="#111827" size={22} strokeWidth={2.5} />
                        </Pressable>
                    </View>

                    {/* Weekdays */}
                    <View className="flex-row w-full mb-2">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
                            <View key={d} style={{ width: '14.28%', alignItems: 'center' }}>
                                <Text className={`text-[13px] font-bold ${i === 0 ? 'text-red-500' : 'text-muted-foreground'}`}>{d}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Days Grid */}
                    <View className="flex-row flex-wrap w-full mt-2">
                        {days.map((item, i) => {
                            const dCopy = new Date(item.date);
                            dCopy.setHours(0, 0, 0, 0);
                            
                            const isSelected = dCopy.getTime() === new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
                            const isToday = dCopy.getTime() === today.getTime();
                            const isFuture = maxDate ? dCopy.getTime() > maxDate.getTime() : false;
                            const isSunday = dCopy.getDay() === 0;

                            let cellOpacity = 1;
                            if (isFuture) cellOpacity = 0.3;
                            else if (!item.isCurrentMonth) cellOpacity = 0.3;

                            return (
                                <View key={i} style={{ width: '14.28%', alignItems: 'center', marginBottom: 12 }}>
                                    <Pressable
                                        onPress={() => {
                                            if (!isFuture) {
                                                onSelect(item.date);
                                            }
                                        }}
                                        className={`w-8 h-8 items-center justify-center rounded-full ${isSelected ? 'bg-primary' : ''}`}
                                        style={{ opacity: cellOpacity }}
                                        disabled={isFuture}
                                    >
                                        <Text className={`text-[14px] font-bold ${isSelected ? 'text-primary-foreground' : isSunday ? 'text-red-500' : isToday ? 'text-primary' : 'text-foreground'}`}>
                                            {item.date.getDate()}
                                        </Text>
                                    </Pressable>
                                </View>
                            );
                        })}
                    </View>

                    <View className="flex-row justify-end mt-4">
                        <Pressable onPress={onClose} className="px-4 py-2 rounded-xl active:opacity-70 bg-secondary/20">
                            <Text className="text-secondary-foreground font-bold text-[14px]">Cancel</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}
