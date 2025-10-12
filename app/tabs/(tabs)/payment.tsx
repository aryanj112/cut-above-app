import { useState, useEffect } from 'react';
import { StripeProvider, usePaymentSheet } from '@stripe/stripe-react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { View } from '@/components/ui/view';
import { Alert, Button } from 'react-native';

export default function HomePage() {
    const publishableKey = "pk_test_51SCaX8KERkFwkSLpVXzQUHl5zREOCurWBbsyLTOYYQiFbuFNXvZDVGmoVpCCTvOLcSTXSrLEh09seZRCwgXfLdc900uWYZboar";
    const { initPaymentSheet, presentPaymentSheet, loading } = usePaymentSheet();

    useEffect(() => {
        initializePaymentSheet();
    }, []);

    const initializePaymentSheet = async () => {

        const fetchPaymentSheetParams = async () => {
            let API_URL = "https://prxnaijykdpsjozebbmu.supabase.co/functions/v1/stripe-webhook"
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            console.log("HEY", data)
            const { paymentIntent, ephemeralKey, customer } = data
            return {
                paymentIntent,
                ephemeralKey,
                customer
            };
        }

        const { paymentIntent, ephemeralKey, customer } = await fetchPaymentSheetParams();
        console.log("HEYEYEYEYFE FEFEFEFEFEGFEFEFe")

        console.log(paymentIntent)
        const { error } = await initPaymentSheet(
            {
                customerId: customer,
                customerEphemeralKeySecret: ephemeralKey,
                paymentIntentClientSecret: paymentIntent,
                merchantDisplayName: 'Example, Inc.',
            }
        );
        console.log("ERROR", error)
    }

    async function buy() {
        const { error } = await presentPaymentSheet();
        if (error) {
            Alert.alert(`Error code: ${error.code}`, error.message);
        } else {
            Alert.alert('Success', 'Your payment has been confirmed successfully');
        }
    }

    return (
        <View>
            <StripeProvider
                publishableKey={publishableKey}
            // merchantIdentifier="merchant.identifier" // required for Apple Pay
            // urlScheme="your-url-scheme" // required for 3D Secure and bank redirects
            >
                <Button title="BUY" onPress={buy} />
            </StripeProvider>
        </View>
    );
}
