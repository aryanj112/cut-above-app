import {View, Text, Image} from "react-native";

export default function HomePage() {
  return (
    <View style={{flex: 1, alignItems: "center", justifyContent: "center"}}>
      <Text>Home Page</Text>
      <Image 
              source = {require('../../../assets/images/logo.png')}
              style={{width: 200, height: 200, marginBottom: 20}}
        />
    </View>
  );
}
