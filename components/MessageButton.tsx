import React from "react";

import { Box } from "@/components/ui/box";
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from "@/components/ui/button";
import { useState } from "react";
import * as Linking from "expo-linking";
import { ActionSheetIOS, Platform, Pressable, Modal, View } from "react-native";

export default function MessageButton() {
    const [open, setOpen] = useState(false);
    const phone = "+2403089776"
    //options to call or text
    const callUrl = `tel:${phone}`;
    const smsUrl = Platform.select({
        ios: `sms:${phone}`,                       
        android: `sms:${phone}?body=Hey`,   
        default: `sms:${phone}`,                   
    })!;
    // open url
    const openURL = async (url: string) => {
        if (await Linking.canOpenURL(url)) {
            Linking.openURL(url);
        }
    };
  //when button is pressed
    const handlePress = () => {
        if (Platform.OS === "ios") {
            ActionSheetIOS.showActionSheetWithOptions(
                { options: ["Cancel", "Text Vince", "Call Vince"], cancelButtonIndex: 0 },
                (i) => {
                    if (i === 1) openURL(smsUrl);   // text Vince
                    if (i === 2) openURL(callUrl);  // call Vince
                }
            );
        } else {
            // On Android: open the custom modal
            setOpen(true);
        }
    };
    return (
        <>
            <Box className="absolute bottom-6 right-6">
                <Button
                    className="rounded-full bg-primary-500 px-4 py-3"
                    onPress={handlePress} 
                >
                    <ButtonText> Contact Us </ButtonText>
                </Button>
            </Box>
            <Modal
                visible={open}                         // Show modal when "open" is true
                transparent
                animationType="fade"
                onRequestClose={() => setOpen(false)}  // Close when back button pressed
            >
                <Pressable
                    style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }}
                    onPress={() => setOpen(false)}
                >
                    <View style={{
                        position: "absolute", bottom: 40, left: 20, right: 20,
                        backgroundColor: "#fff", borderRadius: 8
                    }}>
                        <Pressable onPress={() => { setOpen(false); openURL(smsUrl); }}>
                            <Text style={{ padding: 16, textAlign: "center" }}>Text Us</Text>
                        </Pressable>
                        <Pressable onPress={() => { setOpen(false); openURL(callUrl); }}>
                            <Text style={{ padding: 16, textAlign: "center" }}>Call Us</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Modal>
        </>
    );
}