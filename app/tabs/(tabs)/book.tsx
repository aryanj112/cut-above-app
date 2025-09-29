import { Text, View, Dimensions, ScrollView, Pressable } from "react-native";
import { Calendar, CalendarList, Agenda } from 'react-native-calendars';
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ButtonText } from "@/components/ui/button";
import { Button } from "@/components/ui/button";

const { width } = Dimensions.get("window");

export default function BookPage() {
    const [day, setDay] = useState('');

    return (
        <ScrollView className="flex-1">
            <View className="items-center">
                <BookCalendar day={day} setDay={setDay} />
            </View>
            <Timings day={day} />
        </ScrollView>
    );
}

const Timings = ({ day }: { day: string }) => {
    const timeData = [
        {
            section: "Morning",
            times: [
                "8:00 AM", "8:30 AM",
                "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
                "11:00 AM", "11:30 AM"
            ]
        },
        {
            section: "Afternoon",
            times: [
                "12:00 PM", "12:30 PM",
                "1:00 PM", "1:30 PM",
                "2:00 PM", "2:30 PM",
                "3:00 PM", "3:30 PM",
                "4:00 PM", "4:30 PM"
            ]
        },
        {
            section: "Evening",
            times: [
                "5:00 PM", "5:30 PM",
                "6:00 PM", "6:30 PM",
                "7:00 PM", "7:30 PM",
                "8:00 PM", "8:30 PM"
            ]
        },
        {
            section: "After Hours",
            times: [
                "9:00 PM", "9:30 PM",
                "10:00 PM", "10:30 PM",
                "11:00 PM", "11:30 PM"
            ]
        }
    ];
    const TimeSlot = ({ time }: { time: string }) => {
        return (
            <Button
                size="lg"
                variant="solid"
                className="bg-white rounded-xl"
                onPress={() => console.log(day.concat(" ", time))}
            >
                <ButtonText className="text-black font-semibold">{time}</ButtonText>
            </Button>
        );
    }

    const TimeSection = ({ timeSection, times }: { timeSection: string, times: string[] }) => {
        return (
            <>
                {day && (
                    <>
                        <Text className="text-[1.5rem] font-bold mb-[1rem]">{timeSection}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }} className="mb-[1rem]">
                            {times.map((time, index) => (
                                <TimeSlot key={index} time={time} />
                            ))}
                        </ScrollView>
                    </>
                )}
            </>
        );
    }

    return (
        <View className="flex-1 items-start m-[1.25rem]">
            {timeData.map(({ section, times }) => (
                <TimeSection key={section} timeSection={section} times={times} />
            ))}
        </View>
    );
}

const BookCalendar = ({ day, setDay }: { day: any, setDay: any }) => {
    return (
        <View
            style={{
                width: width * 0.85,
                borderRadius: 16,
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOpacity: 0.2,
                shadowRadius: 6,
                marginTop: 10,
                shadowOffset: { width: 0, height: 3 },
                elevation: 4, // Android shadow
            }}
        >
            <Calendar
                onDayPress={d => { setDay(d.dateString) }}
                markedDates={{
                    [day]: { selected: true, disableTouchEvent: true, selectedColor: '#94989aff' }

                }}
                theme={{
                    calendarBackground: '#2C2C2C',
                    selectedDayBackgroundColor: '#fff',
                    todayTextColor: '#fff',
                    dayTextColor: '#fff',
                    monthTextColor: '#fff',
                    arrowColor: '#fff',
                    disabledArrowColor: '#ff0000ff',
                    textDayFontFamily: 'Helvetica',
                    textDayFontWeight: '700',
                    textMonthFontFamily: 'Helvetica',
                    textMonthFontWeight: '700',
                    textDayHeaderFontFamily: 'Helvetica',
                    textDayHeaderFontWeight: '700',
                    textDayFontSize: 16,
                    textMonthFontSize: 20,
                    textDayHeaderFontSize: 14,
                }}
            />
        </View>
    )
}