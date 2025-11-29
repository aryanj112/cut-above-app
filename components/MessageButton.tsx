import React from "react";

import { Box } from "@/components/ui/box";
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from "@/components/ui/button";
import { useState } from "react";
import * as Linking from "expo-linking";
import { ActionSheetIOS, Platform, Pressable, Modal, View } from "react-native";
import { PhoneIcon } from "@/components/ui/icon";
import { MessageCircleIcon } from "@/components/ui/icon";

export default function MessageButton() {
    const [open, setOpen] = useState(false);
    const phone = "+2403089776" // we can change to Vince's whenever
    //options to call or text
    const callUrl = `tel:${phone}`;
    const smsUrl = Platform.select({
        ios: `sms:${phone}`,
        android: `sms:${phone}?body=Hey`,
        default: `sms:${phone}`,
    })!;
    // opens url for call/text and then closes modal
    const openURL = async (url: string) => {
        try {
            if (await Linking.canOpenURL(url)) await Linking.openURL(url);
        } finally {
            setOpen(false);
        }
    };

    return (
        <>
            <Box className="absolute bottom-6 right-6 z-50">
                <Pressable
                    onPress={() => setOpen(true)}
                    style={{
                        width: 45,
                        height: 45,
                        borderRadius: 28,
                        backgroundColor: "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                        shadowColor: "#000",
                        shadowOpacity: 0.25,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 4 },
                        elevation: 6,
                    }}
                >
                    {/* <TbMessageCircle className="text-white h-6 w-6" /> */}
                    {/* <PhoneIcon className="text-white h-2 w-2" /> */}
                    <MessageCircleIcon className="text-white h-6 w-6" />
                </Pressable>
            </Box>
            <Modal
                visible={open}
                transparent
                animationType="fade"
                onRequestClose={() => setOpen(false)}
            >
                <Pressable // closes modal by pressing outside of pop-up
                    style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }}
                    onPress={() => setOpen(false)}
                >
                    <Pressable
                        onPress={() => { }} // modal card
                        style={{
                            position: "absolute",
                            left: 16,
                            right: 16,
                            bottom: 28,
                            backgroundColor: "#fff",
                            borderRadius: 14,
                            overflow: "hidden",
                        }}
                    >
                        <View style={{ paddingTop: 16, paddingBottom: 8, alignItems: "center" }}>
                            <Text className="text-base font-medium">Contact Vince</Text>
                        </View>
                        <View style={{ height: 1, backgroundColor: "#eee" }} />
                        <Pressable
                            onPress={() => openURL(smsUrl)}
                            style={{ padding: 18, alignItems: "center" }}
                        >
                            <Text className="text-base">Text Us</Text>
                        </Pressable>
                        <View style={{ height: 1, backgroundColor: "#eee" }} />
                        <Pressable
                            onPress={() => openURL(callUrl)}
                            style={{ padding: 18, alignItems: "center" }}
                        >
                            <Text className="text-base">Call Us</Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
}