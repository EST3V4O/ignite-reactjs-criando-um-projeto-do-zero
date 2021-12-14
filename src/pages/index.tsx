import Head from 'next/head';
import Link from 'next/link';
import { GetStaticProps } from 'next';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Prismic from '@prismicio/client';

import { FiCalendar, FiUser } from 'react-icons/fi';

import { useState } from 'react';
import { getPrismicClient } from '../services/prismic';

import common from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>(
    postsPagination.results.map(post => ({
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'd MMM Y',
        {
          locale: ptBR,
        }
      ),
    }))
  );
  const [page, setPage] = useState<string | null>(postsPagination.next_page);

  async function handleLoadingMore(): Promise<void> {
    const response = await fetch(page);
    const data = await response.json();

    const newPosts = data.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'd MMM Y',
          {
            locale: ptBR,
          }
        ),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });
    setPosts([...posts, ...newPosts]);
    setPage(data.next_page);
  }

  return (
    <>
      <Head>
        <title>Home | Spacetraveling</title>
      </Head>

      <main className={common.contentContainer}>
        <section className={styles.posts}>
          {posts.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a className={styles.post}>
                <h3>{post.data.title}</h3>
                <p>{post.data.subtitle}</p>
                <section>
                  <div>
                    <FiCalendar />
                    <time>{post.first_publication_date}</time>
                  </div>
                  <div>
                    <FiUser />
                    <span>{post.data.author}</span>
                  </div>
                </section>
              </a>
            </Link>
          ))}
        </section>
        {page !== null && (
          <button
            type="button"
            className={styles.loadingMore}
            onClick={handleLoadingMore}
          >
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
    },
    // revalidate: 60 * 30, // 30 minutos
  };
};
