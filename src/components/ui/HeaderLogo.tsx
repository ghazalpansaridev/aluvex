import { Image, StyleSheet } from 'react-native';

const logo = require('../../../assets/Fittmart-logo-brand.png');

export function HeaderLogo() {
  return (
    <Image source={logo} style={styles.logo} resizeMode="contain" />
  );
}

const styles = StyleSheet.create({
  logo: { width: 120, height: 34 },
});
