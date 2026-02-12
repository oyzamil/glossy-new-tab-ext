import { Modal as AntModal, ModalProps as AntModalProps } from 'antd';

export interface ModalProps extends AntModalProps {
  children?: React.ReactNode;
  className?: string;
}

// Only memo the whole component if parent re-renders often
const Modal: React.FC<ModalProps> = ({ children, className, styles, ...restProps }) => {
  return (
    <AntModal
      className={cn(className)}
      mask={{
        closable: true,
        blur: true,
      }}
      styles={styles}
      {...restProps}
      centered
    >
      {children}
    </AntModal>
  );
};

export default Modal;
