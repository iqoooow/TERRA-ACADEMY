import { createPortal } from 'react-dom';

/**
 * ModalPortal — renders children directly into document.body,
 * bypassing any CSS transform / overflow / stacking-context on parent elements.
 * Use this to wrap every modal's outermost fixed container.
 */
const ModalPortal = ({ children }) => createPortal(children, document.body);

export default ModalPortal;
