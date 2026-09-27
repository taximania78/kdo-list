import { render, screen } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/components/ThemeProvider';

function Probe() {
  const theme = useTheme();
  return <p>{`${Object.keys(theme).join(',')}|${theme.name}|${theme.config.appTitle}`}</p>;
}

describe('useTheme', () => {
  it('returns the default theme outside a provider', () => {
    render(<Probe />);
    expect(screen.getByText("name,config|default|Liste d'anniversaire")).toBeInTheDocument();
  });

  it('returns the provided theme', () => {
    render(
      <ThemeProvider theme="christmas">
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByText('name,config|christmas|Liste de Noël')).toBeInTheDocument();
  });
});
