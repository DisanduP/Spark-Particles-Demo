import React from 'react';

export const ControlSection = ({ title, children }) => {
  return (
    <section>
      <h4>{title}</h4>
      {children}
    </section>
  );
};
