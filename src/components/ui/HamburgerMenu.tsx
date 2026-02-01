import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  Platform,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.75, 300);

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  isOpen,
  onClose,
  children,
}) => {
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : DRAWER_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
};

interface HamburgerIconProps {
  onPress: () => void;
  color?: string;
}

export const HamburgerIcon: React.FC<HamburgerIconProps> = ({
  onPress,
  color = '#000',
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.iconButton}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <View style={styles.hamburgerIcon}>
        <View style={[styles.hamburgerLine, { backgroundColor: color }]} />
        <View style={[styles.hamburgerLine, { backgroundColor: color }]} />
        <View style={[styles.hamburgerLine, { backgroundColor: color }]} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconButton: {
    padding: 8,
    marginRight: 8,
  },
  hamburgerIcon: {
    width: 28,
    height: 28,
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  hamburgerLine: {
    width: 24,
    height: 3,
    borderRadius: 2,
  },
});
