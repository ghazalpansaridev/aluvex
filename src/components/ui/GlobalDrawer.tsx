import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { HamburgerMenu, HamburgerIcon } from './HamburgerMenu';
import { DrawerContent } from './DrawerContent';
import { useDrawer } from '../../lib/drawer-context';

export const GlobalDrawer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isDrawerOpen, openDrawer, closeDrawer } = useDrawer();

  return (
    <View style={styles.container}>
      {/* Hamburger menu icon */}
      <View style={styles.iconsContainer}>
        <HamburgerIcon onPress={openDrawer} color="#333" />
      </View>

      {/* Main content */}
      {children}

      {/* Slide-out drawer */}
      <HamburgerMenu isOpen={isDrawerOpen} onClose={closeDrawer}>
        <DrawerContent onClose={closeDrawer} />
      </HamburgerMenu>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  iconsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    marginRight: 8,
    flexDirection: 'column', // Stack vertically
    alignItems: 'center',
  },
});
