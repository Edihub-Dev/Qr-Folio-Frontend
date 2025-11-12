import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";

const SUPPORTED_TRANSFORM_KEYS = new Set([
  "x",
  "y",
  "translateX",
  "translateY",
  "scale",
  "scaleX",
  "scaleY",
  "rotate",
  "rotateX",
  "rotateY",
  "rotateZ",
]);

const formatUnit = (value, unit) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "number") return `${value}${unit}`;
  return value;
};

const toStyle = (motionProps = {}) => {
  if (!motionProps || typeof motionProps !== "object") return {};

  const style = {};
  const transformParts = [];

  Object.entries(motionProps).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    switch (key) {
      case "opacity":
        style.opacity = value;
        break;
      case "x":
      case "translateX":
        transformParts.push(`translateX(${formatUnit(value, "px")})`);
        break;
      case "y":
      case "translateY":
        transformParts.push(`translateY(${formatUnit(value, "px")})`);
        break;
      case "scale":
        transformParts.push(`scale(${value})`);
        break;
      case "scaleX":
        transformParts.push(`scaleX(${value})`);
        break;
      case "scaleY":
        transformParts.push(`scaleY(${value})`);
        break;
      case "rotate":
        transformParts.push(`rotate(${formatUnit(value, "deg")})`);
        break;
      case "rotateX":
        transformParts.push(`rotateX(${formatUnit(value, "deg")})`);
        break;
      case "rotateY":
        transformParts.push(`rotateY(${formatUnit(value, "deg")})`);
        break;
      case "rotateZ":
        transformParts.push(`rotateZ(${formatUnit(value, "deg")})`);
        break;
      default:
        if (!SUPPORTED_TRANSFORM_KEYS.has(key)) {
          style[key] = value;
        }
        break;
    }
  });

  if (transformParts.length) {
    style.transform = transformParts.join(" ");
  }

  return style;
};

const toTransition = (transition) => {
  if (!transition || typeof transition !== "object") return undefined;
  const duration = transition.duration ?? 0.3;
  const delay = transition.delay ?? 0;
  let easing = "ease";
  if (typeof transition.ease === "string") {
    easing = transition.ease;
  } else if (Array.isArray(transition.ease) && transition.ease.length === 4) {
    easing = `cubic-bezier(${transition.ease.join(",")})`;
  }
  return `all ${duration}s ${easing} ${delay}s`;
};

const createMotionComponent = (tag) => {
  const MotionComponent = React.forwardRef(
    (
      {
        initial,
        animate,
        exit, // ignored
        whileHover,
        whileTap,
        whileInView,
        viewport,
        transition,
        layout, // ignored
        layoutId, // ignored
        variants, // ignored
        style,
        onMouseEnter,
        onMouseLeave,
        onMouseDown,
        onMouseUp,
        onTouchStart,
        onTouchEnd,
        onHoverStart,
        onHoverEnd,
        children,
        ...rest
      },
      ref
    ) => {
      const initialStyle = useMemo(() => toStyle(initial), [initial]);
      const animateStyle = useMemo(() => toStyle(animate), [animate]);
      const hoverStyle = useMemo(() => toStyle(whileHover), [whileHover]);
      const tapStyle = useMemo(() => toStyle(whileTap), [whileTap]);
      const inViewStyle = useMemo(() => toStyle(whileInView), [whileInView]);
      const hasWhileInView = useMemo(
        () => inViewStyle && Object.keys(inViewStyle).length > 0,
        [inViewStyle]
      );
      const transitionStyle = useMemo(() => toTransition(transition), [transition]);

      const [forceInView, setForceInView] = useState(() => {
        if (typeof window === "undefined") return false;
        return window.innerWidth <= 1024;
      });

      useEffect(() => {
        if (typeof window === "undefined") return undefined;

        const media = window.matchMedia("(max-width: 1024px)");
        const update = () => setForceInView(media.matches);

        update();
        media.addEventListener("change", update, { passive: true });
        return () => media.removeEventListener("change", update, { passive: true });
      }, []);

      const shouldObserveInView = useMemo(
        () => hasWhileInView && !forceInView,
        [hasWhileInView, forceInView]
      );

      const [baseStyle, setBaseStyle] = useState(() => ({
        ...initialStyle,
        ...(transitionStyle ? { transition: transitionStyle } : {}),
        ...(shouldObserveInView ? {} : animateStyle),
      }));
      const [hovered, setHovered] = useState(false);
      const [pressed, setPressed] = useState(false);
      const [inView, setInView] = useState(() => {
        return shouldObserveInView ? false : true;
      });
      const elementRef = useRef(null);

      const setRefs = useCallback(
        (node) => {
          elementRef.current = node;
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        },
        [ref]
      );

      useEffect(() => {
        if (!shouldObserveInView) {
          setInView(true);
          return undefined;
        }

        const node = elementRef.current;
        if (!node) {
          return undefined;
        }

        const once = viewport?.once !== undefined ? Boolean(viewport.once) : true;
        const margin = typeof viewport?.margin === "string" ? viewport.margin : "0px";
        const amountRaw = viewport?.amount;
        let threshold = 0.2;
        if (typeof amountRaw === "number") {
          threshold = Math.min(Math.max(amountRaw, 0), 1);
        }

        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                setInView(true);
                if (once) {
                  observer.disconnect();
                }
              } else if (!once) {
                setInView(false);
              }
            });
          },
          {
            root: viewport?.root instanceof Element ? viewport.root : null,
            rootMargin: margin,
            threshold,
          }
        );

        observer.observe(node);

        return () => observer.disconnect();
      }, [shouldObserveInView, viewport, inViewStyle]);

      useEffect(() => {
        if (shouldObserveInView && inView) {
          return;
        }

        setBaseStyle({
          ...initialStyle,
          ...(transitionStyle ? { transition: transitionStyle } : {}),
          ...(shouldObserveInView ? {} : animateStyle),
        });
      }, [initialStyle, transitionStyle, shouldObserveInView, inView, animateStyle]);

      useEffect(() => {
        if (shouldObserveInView) return;
        setBaseStyle({
          ...initialStyle,
          ...(transitionStyle ? { transition: transitionStyle } : {}),
          ...animateStyle,
        });
      }, [animateStyle, transitionStyle, shouldObserveInView, initialStyle]);

      useEffect(() => {
        if (!shouldObserveInView) return;
        if (!inView) {
          setBaseStyle({
            ...initialStyle,
            ...(transitionStyle ? { transition: transitionStyle } : {}),
          });
          return;
        }

        if (Object.keys(inViewStyle).length === 0) return;
        const frame = requestAnimationFrame(() => {
          setBaseStyle((prev) => ({
            ...prev,
            ...inViewStyle,
            ...(transitionStyle ? { transition: transitionStyle } : {}),
          }));
        });
        return () => cancelAnimationFrame(frame);
      }, [shouldObserveInView, inView, inViewStyle, initialStyle, transitionStyle]);

      const combinedStyle = {
        ...style,
        ...baseStyle,
        ...(hovered ? hoverStyle : {}),
        ...(pressed ? tapStyle : {}),
      };

      const handleMouseEnter = (event) => {
        if (hoverStyle && Object.keys(hoverStyle).length) {
          setHovered(true);
        }
        onHoverStart?.(event);
        onMouseEnter?.(event);
      };

      const handleMouseLeave = (event) => {
        if (hovered) setHovered(false);
        if (pressed) setPressed(false);
        onHoverEnd?.(event);
        onMouseLeave?.(event);
      };

      const handleMouseDown = (event) => {
        if (tapStyle && Object.keys(tapStyle).length) {
          setPressed(true);
        }
        onMouseDown?.(event);
      };

      const handleMouseUp = (event) => {
        if (pressed) {
          setPressed(false);
        }
        onMouseUp?.(event);
      };

      const handleTouchStart = (event) => {
        if (tapStyle && Object.keys(tapStyle).length) {
          setPressed(true);
        }
        onTouchStart?.(event);
      };

      const handleTouchEnd = (event) => {
        if (pressed) {
          setPressed(false);
        }
        onTouchEnd?.(event);
      };

      return React.createElement(
        tag,
        {
          ref: setRefs,
          style: combinedStyle,
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave,
          onMouseDown: handleMouseDown,
          onMouseUp: handleMouseUp,
          onTouchStart: handleTouchStart,
          onTouchEnd: handleTouchEnd,
          ...rest,
        },
        children
      );
    }
  );

  MotionComponent.displayName = `Motion(${typeof tag === "string" ? tag : tag.displayName || tag.name || "Component"})`;
  return MotionComponent;
};

export const motion = new Proxy(
  {},
  {
    get: (_, key) => createMotionComponent(key),
  }
);

export const AnimatePresence = ({ children }) => React.createElement(React.Fragment, null, children);
