// Simple script to generate placeholder icons
// Creates minimal colored PNG files for the extension

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '../public/icons');

// Ensure icons directory exists
if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

// Pre-generated minimal PNG icons (blue circle on transparent background)
// These are valid PNG files created with a simple blue circle design

// 16x16 icon - minimal blue circle
const icon16Base64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAbwAAAG8B8aLcQwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAACvSURBVDiNpZMxDoMwDEWf2TqxceAAHKNH4AqcgDMwsHIGjsCROALsLIgBbBW1FCHy9WP77diGjBhgq6pL4KTqEGAJTARi2f8GLoDMBu6A7CIwAa2qLkXrqOryRRKAUUrZq+o6Mn7OAUjOuROAqMheEclAc7cGxJi+l6qac/4BbIAT0AGXZr4BJiACKRfYZnucgZZ/nFLaicim/xIgxhiAVQZui3YAsNy+kBdwBdqR8TsLKmBijCKJegAAAABJRU5ErkJggg==';

// 48x48 icon - blue circle
const icon48Base64 = 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA7AAAAOwBeShxvQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAGRSURBVGiB7Zo9TsMwGIaf0CKxscEBOAbH4ApcgRNwBgZWzsAROBJHYGdBDGArqIUi8jF4dtomTprY+Xj0vZLlxK7z+HMcx4KIiIiIiIj8Q7TWKeBYa30cODcA+4FjAPK+A1hrDWyFzv0s9N2q1vpsb9zDAm9hARSwBKaAa+ADOAKedl5/Bx4Ch0BF4NggAlNaa30BFEAbG+cTOAWcWGvP+46dAldADji5XANYa88BG1hgDKwDb4Br4BpIABOwJjDAChgCU+BN13hEYIC1Nge8AI+AG+AWuAKmwBi4/xcBM6ANNIFj4Al4ADJAB3gKGAAdYAZMAJvANbAGLIAucOY/AhrAOeD+d0Lr+wVmwBywC5wBr0ALOAJugXvgAbgBJsAdcA9cAy/+BOwCLuAMOAAugOfAHfAIPAPXwB3wBNz9iwD3QA44APLAA/AAXPkjcAs8AleBe+AJePwXAdv+BGZAG+gBN8ATcOlfgRvgBngAnv1rQN8/gRnQAvrALfAC3AHP/hF4AJ79awDd/y8gIiIiIiLyH3EGPLjJF8C+Xq8AAAAASUVORK5CYII=';

// 128x128 icon - blue circle with slight gradient
const icon128Base64 = 'iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANzSURBVHic7d1NaxNBGMDx/8wmJkZNfCm+4EERvIgePHjx4l0Pgjc/gB8heBDxA3jy5sGT4EkQD4pHRSooKoqC1mprbWKS3Z0d0YMH22R3M7uZYeb/O+3OzuY/u7OZnQVjjDHGGGOMMcYYY4wxxhhjjDHGGGNMtUWuC7Bu7hS4CfSdR1oHXAX2A91yi/JxkfcILATWA88BfhN4HzgPXAeWgGngMPCJyjz+S1C8Ad4C7wJXgOvAdOAauZQk0AvApsDlcYE7gM7wRfkMYC3wOXAT+A/wAFgCjgMPK/T4P0dxDHjuuh4/CKwOTLQArAbU+DHAV0AncNF1wX4ArAHsAL7VuTiPAP7kugI/Cs5Rd6yz0jkHLOMi8AZw3XVFesCdQAuuK+kGHgFHU5fCH4BTQD/RB38H/kD+AcKf4CHwEMBGYAOPgZ8AW4DTNAO/AH8HmA08AF4D24GVwCPgfsD1VE8TeBL8E4D1wHPgYuCK7AXYAqzgGTAArAD8CXhR8wSc4QWgnXtAM+AA8ITaPQeuAV8H2v4YmEtzAU4DA4ELsQZYC3xB8wEgeDFMEtgBHAuUhA8BPwCn0l6AKWAdkAbOA0dq3c9hwDLgBJqXgBXgIuB54DfgauD1cxhwGBgBDqV9B94HPgM3ae5FkITOC0FPgBvA9TQ3wBbgdeAZsD39HXgAfEPzDMyCx8BL4CkwmfYCrADWAS9ojoDTgYLgUfAR4ArgArCQxcmIpBMYAZ4HDqe9CU8AjwAngefZWIwksh94knUCbAQ8AlbzFBgLtaC+DwLJdOAi+Bgwlt1FiaPPgZ+By4FryIngL0AtfQi4I8SBOwDR7wLJ9K8BuwGnQy2kPh5/H7gF2EJzJIw2iGI18AI4H7LzLoCjwI0Q/dfIJ2AmsBB4vVrPBE4DegJ2vDN7g0/AdqAn4PnvBJaGWmhwT4BNXAUuhyrI/bDl0JMwCqCH5g4Eu4G5ENs8BqwKXaBjwEZgHYH2fj8APgYJIUAv0EPzOcC5dC/Ga+B8yKMEcBi4CIwAt9LeWGuAm8BpYF2Ic9+aTgSrACPARZrPhPKkGxgGelPfKQXdR8T3AQeB/ZkWNLiLgLG0d1YBLAD28xgYTHmTzAPm01x/bVykvRB7gLnANVLcmKXAdOBxiH7vB/YBfwdaoI3AOuBV4AZYDTQA+wLV6QPACHAtq4v9F2gnML2J+MmHAAAAAElFTkSuQmCC';

// Write icons to files
function writeIcon(filename, base64Data) {
  const buffer = Buffer.from(base64Data, 'base64');
  const path = join(iconsDir, filename);
  writeFileSync(path, buffer);
  console.log(`Created ${path}`);
}

writeIcon('icon16.png', icon16Base64);
writeIcon('icon48.png', icon48Base64);
writeIcon('icon128.png', icon128Base64);

console.log('Icons generated successfully!');
