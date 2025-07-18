import { Tabs } from "expo-router";
import { TabBar } from "../../components/TabBar";

const Layout = () => {
  return (
    <Tabs 
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: "Home",
          headerShown: false,
        }} 
      />
      <Tabs.Screen 
        name="explore" 
        options={{ 
          title: "Explore",
          headerShown: false,
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: "Profile",
          headerShown: false,
        }} 
      />
    </Tabs>
  );
};

export default Layout;
