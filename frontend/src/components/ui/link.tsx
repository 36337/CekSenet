import * as Headless from '@headlessui/react'
import React, { forwardRef } from 'react'
import { Link as RouterLink, type LinkProps as RouterLinkProps } from 'react-router-dom'

export const Link = forwardRef(function Link(
  props: { href: string } & Omit<RouterLinkProps, 'to'> & React.ComponentPropsWithoutRef<'a'>,
  ref: React.ForwardedRef<HTMLAnchorElement>
) {
  const { href, ...rest } = props
  
  // External links (http://, https://, mailto:, tel:)
  if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return (
      <Headless.DataInteractive>
        <a href={href} ref={ref} {...rest} />
      </Headless.DataInteractive>
    )
  }
  
  // Internal links - use react-router-dom
  return (
    <Headless.DataInteractive>
      <RouterLink to={href} ref={ref} {...rest} />
    </Headless.DataInteractive>
  )
})
