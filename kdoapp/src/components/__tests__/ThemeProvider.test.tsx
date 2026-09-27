import { render, screen } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/components/ThemeProvider';

function Probe() {
  const { name, isChristmas, config } = useTheme();
  return <p>{`${name}|${isChristmas}|${config.appTitle}`}</p>;
}

describe('useTheme', () => {
  it('returns the default theme outside a provider', () => {
    render(<Probe />);
    expect(screen.getByText("default|false|Liste d'anniversaire")).toBeInTheDocument();
  });

  it('returns the provided theme', () => {
    render(
      <ThemeProvider theme="christmas">
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByText('christmas|true|Liste de Noël')).toBeInTheDocument();
  });
});
